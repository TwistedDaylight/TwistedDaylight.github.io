/*
 * overlay.js — the local annotation overlay, as pure functions.
 *
 * The app never merges. It tracks, per chapter, what the snapshot said
 * (`base*`) versus what the user has since done (`cur*`, `notesAdded`), and
 * exports only the difference. Merging happens on the PC, later.
 *
 * No IndexedDB or DOM in here, so the rules below are directly testable —
 * they're the part that causes duplicate or resurrected notes when wrong.
 */

/** A fresh record for a chapter first seen in this snapshot. */
export function seedRecord(chapter) {
  return {
    path: chapter.path,
    baseFlagged: !!chapter.flagged,
    baseReason: chapter.flagReason || '',
    baseNotes: (chapter.notes || []).slice(),
    curFlagged: !!chapter.flagged,
    curReason: chapter.flagReason || '',
    notesAdded: [],
  };
}

/**
 * Rebase an existing record onto a newer snapshot.
 *
 * Two things have to be true at once:
 *
 *  - A local edit the PC hasn't absorbed yet must survive, so it still
 *    exports.
 *  - A field the user never touched locally must adopt the PC's new value.
 *    Without that second rule the app would keep showing the stale value and,
 *    worse, export it as a "local change" — silently reverting the PC's edit
 *    on the next import.
 *
 * So each field is compared against the *old* base to decide whether the user
 * had touched it, and notes the PC has now absorbed drop out of notesAdded so
 * they can't be imported twice.
 */
export function reseedRecord(existing, chapter) {
  if (!existing) return seedRecord(chapter);

  const newFlagged = !!chapter.flagged;
  const newReason = chapter.flagReason || '';
  const newNotes = (chapter.notes || []).slice();

  const userChangedFlag = existing.curFlagged !== existing.baseFlagged;
  const userChangedReason = existing.curReason !== existing.baseReason;

  return {
    path: chapter.path,
    baseFlagged: newFlagged,
    baseReason: newReason,
    baseNotes: newNotes,
    curFlagged: userChangedFlag ? existing.curFlagged : newFlagged,
    curReason: userChangedReason ? existing.curReason : newReason,
    // Anything the PC has picked up is no longer a local addition.
    notesAdded: (existing.notesAdded || []).filter((n) => !newNotes.includes(n)),
  };
}

/** Does this chapter have anything worth exporting? */
export function isChanged(rec) {
  return rec.curFlagged !== rec.baseFlagged ||
         rec.curReason !== rec.baseReason ||
         (rec.notesAdded && rec.notesAdded.length > 0);
}

/** Every note to show for a chapter: from the snapshot, then local ones. */
export function allNotes(rec) {
  return [
    ...(rec.baseNotes || []).map((text) => ({ text, local: false })),
    ...(rec.notesAdded || []).map((text) => ({ text, local: true })),
  ];
}

export function setFlag(rec, flagged) {
  return { ...rec, curFlagged: !!flagged };
}

export function setReason(rec, reason) {
  return { ...rec, curReason: reason || '' };
}

/** Add a locally-created note, stamped like the PC-side ones. */
export function addNote(rec, text, now = new Date()) {
  const body = String(text || '').trim();
  if (!body) return rec;
  const stamped = `${stampPrefix(now)} — ${body}`;
  return { ...rec, notesAdded: [...(rec.notesAdded || []), stamped] };
}

/** Drop a local note that hasn't been exported yet. Snapshot notes can't be removed here. */
export function removeLocalNote(rec, index) {
  const next = (rec.notesAdded || []).slice();
  if (index < 0 || index >= next.length) return rec;
  next.splice(index, 1);
  return { ...rec, notesAdded: next };
}

function two(n) { return String(n).padStart(2, '0'); }

function stampPrefix(d) {
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ` +
         `${two(d.getHours())}:${two(d.getMinutes())}`;
}

/**
 * ISO 8601 in *local* time, no zone suffix — e.g. 2026-09-22T10:15:00.
 * toISOString() would hand back UTC, which is not what the importer expects.
 */
export function localIsoTimestamp(d = new Date()) {
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}` +
         `T${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
}

/**
 * Build the export payload. Only changed chapters; flags are current state,
 * not a diff; notes_added is local additions only.
 */
export function buildExport({ device, lastUpdate, records, now = new Date() }) {
  const entries = records
    .filter(isChanged)
    .slice()
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((rec) => ({
      path: rec.path,
      flagged: rec.curFlagged,
      flag_reason: rec.curReason,
      notes_added: (rec.notesAdded || []).slice(),
    }));

  return {
    device,
    exported_at: localIsoTimestamp(now),
    // Echo meta.last_update unchanged, as a number.
    based_on_db_indexed_at: lastUpdate == null || lastUpdate === ''
      ? null
      : Number(lastUpdate),
    entries,
  };
}

/**
 * After a successful export the local additions have been handed off. They
 * stay in notesAdded until a snapshot that contains them comes back, because
 * nothing guarantees the PC has imported the file yet — clearing here would
 * lose them if the import never happens.
 */
export function exportFilename(device) {
  // Must be a single, plain path segment: getFileHandle() rejects separators,
  // and a stray ".." would make for a confusing filename in the synced folder.
  const safe = String(device || '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'device';
  return `annotations-${safe}.json`;
}
