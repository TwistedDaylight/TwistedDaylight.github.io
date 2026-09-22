/*
 * app.js — UI and wiring.
 *
 * Flow: pick the synced folder once → read rules-search.db → deserialize into
 * WASM SQLite → seed the local overlay → search / annotate → export one JSON
 * file back into the same folder.
 */

import * as DB from './db.js';
import * as S from './store.js';
import * as O from './overlay.js';
import { marked } from './vendor/marked.js';

const $ = (id) => document.getElementById(id);

const state = {
  sqlite3: null,
  db: null,
  lastUpdate: null,
  chapters: new Map(),   // path -> { path, title, folder, ... } from the snapshot
  overlay: new Map(),    // path -> overlay record
  dirHandle: null,
  folderName: '',
  device: 'phone',
  filter: 'all',
  query: '',
  currentPath: null,
  writable: false,       // folder permission currently granted
};

/* ------------------------------------------------------------------ helpers */

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** snippet() marks are control chars, so escape first then swap in <mark>. */
function highlight(s) {
  return escapeHtml(s)
    .split(DB.HL_OPEN).join('<mark>')
    .split(DB.HL_CLOSE).join('</mark>');
}

let toastTimer = null;
function toast(msg, isError = false) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.toggle('err', !!isError);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), isError ? 5000 : 2200);
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function relativeAge(unixSeconds) {
  if (!unixSeconds) return 'unknown';
  const secs = Math.floor(Date.now() / 1000 - unixSeconds);
  if (secs < 0) return 'in the future';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} minutes old`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? '1 hour old' : `${hours} hours old`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day old' : `${days} days old`;
}

function formatWhen(unixSeconds) {
  if (!unixSeconds) return '—';
  return O.localIsoTimestamp(new Date(unixSeconds * 1000)).replace('T', ' ');
}

/* ------------------------------------------------------------------ screens */

function show(screen) {
  for (const el of document.querySelectorAll('.screen')) el.classList.remove('active');
  $('screen-' + screen).classList.add('active');
  const onApp = screen !== 'setup';
  $('nav').classList.toggle('hidden', !onApp);
  for (const btn of document.querySelectorAll('.nav-btn')) {
    const target = btn.dataset.go;
    btn.classList.toggle('nav-on', target === screen || (screen === 'chapter' && target === 'search'));
  }
}

/* --------------------------------------------------------------- snapshot IO */

async function ensureSqlite() {
  if (!state.sqlite3) state.sqlite3 = await DB.initSqlite();
  return state.sqlite3;
}

async function loadFromBytes(bytes, { cache = true } = {}) {
  const sqlite3 = await ensureSqlite();
  if (state.db) { try { state.db.close(); } catch { /* already gone */ } }
  state.db = DB.openSnapshot(sqlite3, bytes);
  state.lastUpdate = DB.readLastUpdate(state.db);

  const chapters = DB.readAllChapters(state.db);
  state.chapters = new Map(chapters.map((c) => [c.path, c]));
  await syncOverlay(chapters);

  if (cache) {
    try {
      await S.setCachedSnapshot(state.lastUpdate, bytes);
    } catch (e) {
      // Quota or private mode — the app still works, it just won't survive a
      // cold launch without folder access.
      console.warn('Could not cache snapshot:', e);
    }
  }
}

/**
 * Reconcile the overlay with the snapshot we just loaded. Only re-seeds when
 * the snapshot's own timestamp has moved — see overlay.js for why that matters.
 */
async function syncOverlay(chapters) {
  const previousKey = await S.getSnapshotKey();
  const stored = await S.loadOverlay();
  const isNewSnapshot = previousKey !== state.lastUpdate;

  const records = [];
  for (const ch of chapters) {
    const existing = stored.get(ch.path);
    if (!existing) records.push(O.seedRecord(ch));
    else if (isNewSnapshot) records.push(O.reseedRecord(existing, ch));
    else records.push(existing);
  }

  // Chapters that vanished from the snapshot: keep anything with unexported
  // work (losing it silently would be worse), drop the rest.
  const live = new Set(chapters.map((c) => c.path));
  const orphanDrops = [];
  for (const [path, rec] of stored) {
    if (live.has(path)) continue;
    if (O.isChanged(rec)) records.push(rec);
    else orphanDrops.push(path);
  }

  await S.saveRecords(records);
  if (orphanDrops.length) await S.deleteRecords(orphanDrops);
  if (isNewSnapshot) await S.setSnapshotKey(state.lastUpdate);

  state.overlay = new Map(records.map((r) => [r.path, r]));
}

async function loadFromFolder(handle, { silent = false } = {}) {
  const snap = await S.readSnapshot(handle);
  state.dirHandle = handle;
  state.folderName = handle.name || '';
  state.writable = true;
  await loadFromBytes(snap.bytes);
  if (!silent) toast(`Loaded ${state.chapters.size} chapters`);
}

/* -------------------------------------------------------------------- search */

function recordFor(path) {
  return state.overlay.get(path) || null;
}

function passesFilter(rec) {
  if (state.filter === 'all') return true;
  if (!rec) return false;
  if (state.filter === 'flagged') return rec.curFlagged;
  if (state.filter === 'noted') return (rec.baseNotes.length + rec.notesAdded.length) > 0;
  if (state.filter === 'changed') return O.isChanged(rec);
  return true;
}

function currentResults() {
  if (state.query.trim()) {
    return DB.search(state.db, state.query, { limit: 200 })
      .filter((hit) => passesFilter(recordFor(hit.path)));
  }
  return [...state.chapters.values()]
    .filter((ch) => passesFilter(recordFor(ch.path)))
    .map((ch) => ({ path: ch.path, title: ch.title, folder: ch.folder, excerpt: '', titleHit: '' }));
}

function tagsFor(rec) {
  if (!rec) return '';
  const tags = [];
  if (rec.curFlagged) tags.push('<span class="tag tag-flag">flagged</span>');
  const noteCount = rec.baseNotes.length + rec.notesAdded.length;
  if (noteCount) tags.push(`<span class="tag tag-note">${noteCount} note${noteCount > 1 ? 's' : ''}</span>`);
  if (O.isChanged(rec)) tags.push('<span class="tag tag-unsent">unexported</span>');
  return tags.length ? `<div class="result-marks">${tags.join('')}</div>` : '';
}

function renderResults() {
  const results = currentResults();
  const host = $('results');

  if (!results.length) {
    host.innerHTML = `<div class="empty">${
      state.query.trim()
        ? `Nothing matches “${escapeHtml(state.query)}”.`
        : 'No chapters match this filter.'
    }</div>`;
    return;
  }

  host.innerHTML = results.map((hit) => {
    const rec = recordFor(hit.path);
    const title = hit.titleHit ? highlight(hit.titleHit) : escapeHtml(hit.title);
    const excerpt = hit.excerpt
      ? `<div class="result-excerpt">${highlight(hit.excerpt)}</div>`
      : '';
    return `<button class="result" data-path="${escapeHtml(hit.path)}">
      <div class="result-head">
        <span class="result-title">${title}</span>
        <span class="result-folder">${escapeHtml(hit.folder)}</span>
      </div>
      ${excerpt}${tagsFor(rec)}
    </button>`;
  }).join('');
}

/* ------------------------------------------------------------------- chapter */

/**
 * Rulebook Markdown is the user's own content, but it is still file data we
 * didn't write — strip anything executable rather than trusting it.
 */
function renderMarkdown(md) {
  const html = marked.parse(md || '', { async: false, breaks: false, gfm: true });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const bad of doc.body.querySelectorAll('script, style, iframe, object, embed, form, link, meta')) {
    bad.remove();
  }
  for (const el of doc.body.querySelectorAll('*')) {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      else if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  }
  for (const a of doc.body.querySelectorAll('a[href]')) {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  }
  return doc.body.innerHTML;
}

function openChapter(path) {
  const ch = state.chapters.get(path);
  if (!ch) { toast('That chapter is not in this snapshot', true); return; }
  state.currentPath = path;

  $('ch-title').textContent = ch.title;
  $('ch-folder').textContent = ch.folder || path;
  $('ch-body').innerHTML = renderMarkdown(DB.readChapterContent(state.db, path));

  const rec = recordFor(path);
  $('ch-flag').checked = !!(rec && rec.curFlagged);
  $('ch-reason').value = rec ? rec.curReason : '';
  $('ch-note-new').value = '';
  renderNotes();
  show('chapter');
  document.querySelector('#screen-chapter .scroll').scrollTop = 0;
}

function renderNotes() {
  const rec = recordFor(state.currentPath);
  const host = $('ch-notes');
  if (!rec) { host.innerHTML = ''; return; }
  const notes = O.allNotes(rec);
  if (!notes.length) { host.innerHTML = ''; return; }

  let localIndex = -1;
  host.innerHTML = notes.map((n) => {
    if (n.local) localIndex++;
    const del = n.local
      ? `<button class="note-del" data-local="${localIndex}" aria-label="Delete note">✕</button>`
      : '';
    return `<div class="note${n.local ? ' note-local' : ''}">
      <span class="note-text">${escapeHtml(n.text)}</span>${del}
    </div>`;
  }).join('');
}

async function mutate(path, fn) {
  const rec = recordFor(path);
  if (!rec) return;
  const next = fn(rec);
  state.overlay.set(path, next);
  await S.saveRecord(next);
  updateChangeIndicators();
}

/* ------------------------------------------------------------------ settings */

function changedRecords() {
  return [...state.overlay.values()].filter(O.isChanged);
}

function updateChangeIndicators() {
  const changed = changedRecords();
  const badge = $('nav-badge');
  badge.textContent = String(changed.length);
  badge.classList.toggle('hidden', changed.length === 0);

  const summary = $('export-summary');
  summary.classList.toggle('has-changes', changed.length > 0);
  summary.textContent = changed.length === 0
    ? 'No local changes since this snapshot was loaded.'
    : `${changed.length} chapter${changed.length > 1 ? 's' : ''} changed since this snapshot was loaded.`;

  const host = $('changed-list');
  host.innerHTML = changed.length === 0
    ? '<p class="hint" style="margin:0">Nothing pending.</p>'
    : changed.map((rec) => {
      const ch = state.chapters.get(rec.path);
      const what = [];
      if (rec.curFlagged !== rec.baseFlagged) what.push(rec.curFlagged ? 'flagged' : 'unflagged');
      if (rec.curReason !== rec.baseReason) what.push('reason changed');
      if (rec.notesAdded.length) what.push(`${rec.notesAdded.length} new note${rec.notesAdded.length > 1 ? 's' : ''}`);
      return `<button class="changed-item" data-path="${escapeHtml(rec.path)}">
        <div class="changed-title">${escapeHtml(ch ? ch.title : rec.path)}</div>
        <div class="changed-what">${escapeHtml(what.join(' · '))}</div>
      </button>`;
    }).join('');
}

function renderSettings() {
  $('device-input').value = state.device;
  $('device-file').textContent = O.exportFilename(state.device);
  $('export-name').textContent = O.exportFilename(state.device);

  const unix = state.lastUpdate == null ? null : Number(state.lastUpdate);
  $('snap-when').textContent = formatWhen(unix);
  $('snap-age').textContent = relativeAge(unix);
  $('snap-count').textContent = String(state.chapters.size);
  $('snap-folder').textContent = state.folderName || (state.writable ? '—' : 'not open (cached copy)');
  updateChangeIndicators();
}

async function doExport() {
  const status = $('export-status');
  status.className = 'setup-status';
  status.textContent = '';

  try {
    let handle = state.dirHandle || await S.getSavedDirectory();
    if (!handle) {
      handle = await S.pickDirectory();
    }
    // This runs inside the button's click handler, so the permission prompt
    // has the user gesture it needs.
    const granted = await S.ensurePermission(handle, true);
    if (!granted) throw new Error('Permission to write to that folder was declined.');
    state.dirHandle = handle;
    state.folderName = handle.name || '';
    state.writable = true;

    const payload = O.buildExport({
      device: state.device,
      lastUpdate: state.lastUpdate,
      records: [...state.overlay.values()],
    });
    const name = O.exportFilename(state.device);
    await S.writeExport(handle, name, JSON.stringify(payload, null, 2));

    status.classList.add('good');
    status.textContent = `Wrote ${name} — ${payload.entries.length} entr${payload.entries.length === 1 ? 'y' : 'ies'}.`;
    toast('Annotations exported');
    renderSettings();
  } catch (err) {
    if (err && err.name === 'AbortError') return; // user closed the picker
    status.classList.add('err');
    status.textContent = err.message || String(err);
    toast('Export failed', true);
  }
}

/* ---------------------------------------------------------------------- boot */

function showCapabilities() {
  const caps = S.capabilityReport();
  $('cap-table').innerHTML = Object.entries(caps).map(([k, v]) =>
    `<tr><td>${escapeHtml(k)}</td><td class="${v === 'yes' ? 'cap-yes' : 'cap-no'}">${v}</td></tr>`,
  ).join('');
  $('setup-body').classList.add('hidden');
  $('setup-unsupported').classList.remove('hidden');
}

function setSetupStatus(msg, kind = '') {
  const el = $('setup-status');
  el.className = 'setup-status' + (kind ? ' ' + kind : '');
  el.textContent = msg;
}

async function enterApp() {
  renderResults();
  renderSettings();
  show('search');
}

async function boot() {
  wireEvents();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline install is best-effort */ });
  }

  if (!S.supportsFileSystemAccess()) { showCapabilities(); return; }

  state.device = (await S.getDevice()) || 'phone';

  const saved = await S.getSavedDirectory();
  if (saved) $('btn-reopen').classList.remove('hidden');

  // Already-granted folder: go straight in.
  if (saved && await S.ensurePermission(saved, false)) {
    try {
      await loadFromFolder(saved, { silent: true });
      await enterApp();
      return;
    } catch (err) {
      setSetupStatus(err.message || String(err), 'err');
    }
  }

  // Otherwise fall back to the cached snapshot so the app is usable offline
  // with no folder access; exporting will ask for permission when needed.
  try {
    const cached = await S.getCachedSnapshot();
    if (cached) {
      await loadFromBytes(cached.bytes, { cache: false });
      state.writable = false;
      await enterApp();
      toast('Offline copy — reopen the folder to export');
      return;
    }
  } catch (err) {
    console.warn('Cached snapshot unusable:', err);
  }

  show('setup');
}

function wireEvents() {
  $('btn-pick').addEventListener('click', async () => {
    setSetupStatus('');
    try {
      const handle = await S.pickDirectory();
      await loadFromFolder(handle);
      await enterApp();
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      setSetupStatus(err.message || String(err), 'err');
    }
  });

  $('btn-reopen').addEventListener('click', async () => {
    setSetupStatus('');
    try {
      const handle = await S.getSavedDirectory();
      if (!handle) { setSetupStatus('No saved folder — choose one.', 'err'); return; }
      if (!await S.ensurePermission(handle, true)) {
        setSetupStatus('Permission declined.', 'err');
        return;
      }
      await loadFromFolder(handle);
      await enterApp();
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      setSetupStatus(err.message || String(err), 'err');
    }
  });

  const runSearch = debounce(() => { renderResults(); }, 120);
  $('q').addEventListener('input', (e) => { state.query = e.target.value; runSearch(); });
  $('q-clear').addEventListener('click', () => {
    state.query = ''; $('q').value = ''; renderResults(); $('q').focus();
  });

  for (const pill of document.querySelectorAll('.pill')) {
    pill.addEventListener('click', () => {
      state.filter = pill.dataset.filter;
      for (const p of document.querySelectorAll('.pill')) p.classList.toggle('pill-on', p === pill);
      renderResults();
    });
  }

  $('results').addEventListener('click', (e) => {
    const btn = e.target.closest('.result');
    if (btn) openChapter(btn.dataset.path);
  });

  $('changed-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.changed-item');
    if (btn) openChapter(btn.dataset.path);
  });

  $('btn-back').addEventListener('click', () => { renderResults(); show('search'); });

  $('ch-flag').addEventListener('change', async (e) => {
    await mutate(state.currentPath, (rec) => O.setFlag(rec, e.target.checked));
  });

  const saveReason = debounce(async (value) => {
    await mutate(state.currentPath, (rec) => O.setReason(rec, value));
  }, 300);
  $('ch-reason').addEventListener('input', (e) => saveReason(e.target.value));

  $('btn-add-note').addEventListener('click', async () => {
    const box = $('ch-note-new');
    const text = box.value.trim();
    if (!text) return;
    await mutate(state.currentPath, (rec) => O.addNote(rec, text));
    box.value = '';
    renderNotes();
    toast('Note added');
  });

  $('ch-notes').addEventListener('click', async (e) => {
    const btn = e.target.closest('.note-del');
    if (!btn) return;
    await mutate(state.currentPath, (rec) => O.removeLocalNote(rec, Number(btn.dataset.local)));
    renderNotes();
  });

  for (const btn of document.querySelectorAll('.nav-btn')) {
    btn.addEventListener('click', () => {
      const target = btn.dataset.go;
      if (target === 'settings') renderSettings();
      if (target === 'search') renderResults();
      show(target);
    });
  }

  $('btn-save-device').addEventListener('click', async () => {
    const name = $('device-input').value.trim() || 'phone';
    state.device = name;
    await S.setDevice(name);
    renderSettings();
    toast('Device name saved');
  });

  $('btn-export').addEventListener('click', doExport);

  $('btn-reload').addEventListener('click', async () => {
    try {
      // May be running from the cached snapshot with no folder access — in
      // that case ask for the folder rather than dead-ending.
      let handle = state.dirHandle || await S.getSavedDirectory() || await S.pickDirectory();
      if (!await S.ensurePermission(handle, true)) { toast('Permission declined', true); return; }
      await loadFromFolder(handle);
      renderResults();
      renderSettings();
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      toast(err.message || String(err), true);
    }
  });
}

boot().catch((err) => {
  console.error(err);
  setSetupStatus(err.message || String(err), 'err');
  show('setup');
});
