/*
 * store.js — persistence. IndexedDB for the overlay and settings, the File
 * System Access API for the synced folder.
 *
 * Nothing here touches the network: the "sync" is a plain folder that Synology
 * Drive keeps up to date behind our back. We only read one file from it and
 * write one file into it.
 */

const IDB_NAME = 'kt-rules';
const IDB_VERSION = 1;
const STORE_KV = 'kv';
const STORE_OVERLAY = 'overlay';

export const SNAPSHOT_FILENAME = 'rules-search.db';

/* ---------------------------------------------------------------- IndexedDB */

let dbPromise = null;

function idb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV);
        if (!db.objectStoreNames.contains(STORE_OVERLAY)) {
          db.createObjectStore(STORE_OVERLAY, { keyPath: 'path' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(store, mode, fn) {
  return idb().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const kvGet = (key) => tx(STORE_KV, 'readonly', (s) => s.get(key));
export const kvSet = (key, value) => tx(STORE_KV, 'readwrite', (s) => s.put(value, key));
export const kvDelete = (key) => tx(STORE_KV, 'readwrite', (s) => s.delete(key));

/** The whole overlay, as a Map keyed by chapter path. */
export async function loadOverlay() {
  const all = await tx(STORE_OVERLAY, 'readonly', (s) => s.getAll());
  const map = new Map();
  for (const rec of all || []) map.set(rec.path, rec);
  return map;
}

export function saveRecord(rec) {
  return tx(STORE_OVERLAY, 'readwrite', (s) => s.put(rec));
}

/** Write many records in one transaction — used when (re)seeding a snapshot. */
export function saveRecords(records) {
  return tx(STORE_OVERLAY, 'readwrite', (s) => {
    for (const rec of records) s.put(rec);
    return null;
  });
}

/** Drop overlay records for chapters no longer in the snapshot. */
export function deleteRecords(paths) {
  return tx(STORE_OVERLAY, 'readwrite', (s) => {
    for (const path of paths) s.delete(path);
    return null;
  });
}

export function clearOverlay() {
  return tx(STORE_OVERLAY, 'readwrite', (s) => s.clear());
}

/* ------------------------------------------------------------------ settings */

export const getDevice = () => kvGet('device');
export const setDevice = (name) => kvSet('device', name);
export const getSnapshotKey = () => kvGet('snapshotKey');
export const setSnapshotKey = (key) => kvSet('snapshotKey', key);

/* ------------------------------------------------------- cached snapshot bytes */

/**
 * Keep the last snapshot's bytes so a cold launch works with no folder access
 * at all — re-granting a directory permission needs a user gesture, and the
 * whole point is that this works on a train with the NAS unreachable.
 */
export async function getCachedSnapshot() {
  const rec = await kvGet('snapshot');
  if (!rec || !rec.bytes) return null;
  return { key: rec.key, bytes: new Uint8Array(rec.bytes) };
}

export function setCachedSnapshot(key, bytes) {
  // Store a copy of the buffer; the original may be reused by the caller.
  return kvSet('snapshot', { key, bytes: bytes.slice().buffer });
}

/* ------------------------------------------------- File System Access wrappers */

export function supportsFileSystemAccess() {
  return typeof window !== 'undefined' &&
         typeof window.showDirectoryPicker === 'function';
}

/** Exactly what's missing, so a failure on a real device is diagnosable. */
export function capabilityReport() {
  const has = (c) => (c ? 'yes' : 'no');
  return {
    showDirectoryPicker: has(typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'),
    fileSystemHandle: has(typeof window !== 'undefined' && 'FileSystemHandle' in window),
    writableStreams: has(typeof window !== 'undefined' && 'FileSystemWritableFileStream' in window),
    indexedDB: has(typeof indexedDB !== 'undefined'),
    webAssembly: has(typeof WebAssembly !== 'undefined'),
    serviceWorker: has(typeof navigator !== 'undefined' && 'serviceWorker' in navigator),
    secureContext: has(typeof window !== 'undefined' && window.isSecureContext),
  };
}

export async function pickDirectory() {
  const handle = await window.showDirectoryPicker({
    id: 'kt-rules-sync',
    mode: 'readwrite',
    startIn: 'documents',
  });
  try {
    await kvSet('dirHandle', handle);
  } catch (e) {
    // Not every browser can persist a handle. The folder still works for this
    // session; the user just has to pick it again next launch.
    console.warn('Could not remember that folder:', e);
  }
  return handle;
}

export const getSavedDirectory = () => kvGet('dirHandle');

/**
 * Forget which folder the snapshot came from, and the offline copy taken from
 * it. Annotations are deliberately left alone: they live in their own store,
 * keyed by chapter path, so pointing the app at a re-synced or moved folder
 * doesn't cost you unexported work.
 */
export async function forgetDirectory() {
  await kvDelete('dirHandle');
  await kvDelete('snapshot');
}

/**
 * Check, and only if needed request, read-write permission on a stored handle.
 * requestPermission() must be called from a user gesture, so callers pass
 * withPrompt=false during boot and true from a button handler.
 */
export async function ensurePermission(handle, withPrompt = false) {
  if (!handle || !handle.queryPermission) return false;
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if (!withPrompt) return false;
  return (await handle.requestPermission(opts)) === 'granted';
}

/**
 * Read the snapshot out of the synced folder. Falls back to the single *.db
 * in the folder if it isn't named exactly rules-search.db, since the file
 * picker points at a folder the user chose and names drift.
 */
export async function readSnapshot(dirHandle) {
  let fileHandle = null;
  try {
    fileHandle = await dirHandle.getFileHandle(SNAPSHOT_FILENAME);
  } catch {
    const candidates = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && /\.(db|sqlite3?)$/i.test(name)) candidates.push(handle);
    }
    if (candidates.length === 1) {
      fileHandle = candidates[0];
    } else if (candidates.length === 0) {
      throw new Error(
        `No ${SNAPSHOT_FILENAME} in that folder. Point the picker at the folder Synology Drive syncs.`,
      );
    } else {
      throw new Error(
        `That folder has several database files and no ${SNAPSHOT_FILENAME}. ` +
        'Rename the one you want to ' + SNAPSHOT_FILENAME + '.',
      );
    }
  }
  const file = await fileHandle.getFile();
  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    name: fileHandle.name,
    lastModified: file.lastModified,
  };
}

/** Write (overwrite) the annotations file into the same folder. */
export async function writeExport(dirHandle, filename, text) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable(); // truncates by default
  try {
    await writable.write(text);
  } finally {
    await writable.close();
  }
  return filename;
}
