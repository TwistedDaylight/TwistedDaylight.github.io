/*
 * db.js — SQLite/FTS5 snapshot access.
 *
 * The snapshot (rules-search.db) is handed to us as raw bytes and deserialized
 * into an in-memory database. Schema is fixed by the PC-side indexer:
 *
 *   files(path PK, mtime, size, hash, title, folder, indexed_at,
 *         flagged, flag_reason, notes_json)
 *   search  FTS5(path UNINDEXED, title, content, notes, folder UNINDEXED,
 *                tokenize = 'unicode61 remove_diacritics 2')
 *   meta(key PK, value)
 *
 * The sqlite3 module is passed in rather than imported here, so this file runs
 * unchanged under Node (test harness) and in the browser.
 */

// Column indices in the `search` FTS5 table, for snippet()/highlight()/bm25().
const COL_TITLE = 1;
const COL_CONTENT = 2;

// bm25 weights, one per FTS5 column. path/folder are UNINDEXED and never
// contribute, but bm25() still expects a weight for every column. Title
// matches count for a lot more than body matches on a rules lookup.
const BM25_WEIGHTS = '0.0, 8.0, 1.0, 2.0, 0.0';

// snippet() wraps matches in these. Control characters, not HTML tags, so the
// excerpt can be HTML-escaped first and the marks turned into <mark> after —
// otherwise rules text containing "<" would break the markup.
export const HL_OPEN = '\u0001';
export const HL_CLOSE = '\u0002';

/** Load the vendored SQLite WASM build. Browser only. */
export async function initSqlite() {
  const mod = await import('./vendor/sqlite3.js');
  const init = mod.default;
  return init({
    locateFile: (f) => new URL('./vendor/' + f, import.meta.url).href,
    print: () => {},
    printErr: () => {},
  });
}

/** Deserialize snapshot bytes into an in-memory DB. */
export function openSnapshot(sqlite3, bytes) {
  const db = new sqlite3.oo1.DB();
  const p = sqlite3.wasm.allocFromTypedArray(bytes);
  const rc = sqlite3.capi.sqlite3_deserialize(
    db.pointer, 'main', p, bytes.length, bytes.length,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
    sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
  );
  if (rc !== 0) {
    db.close();
    throw new Error('Could not read that file as a SQLite database (code ' + rc + ')');
  }
  assertSchema(db);
  return db;
}

/**
 * Fail loudly and specifically if handed the wrong file or a build without
 * FTS5 — otherwise the app just looks broken.
 */
function assertSchema(db) {
  const names = db.selectArrays(
    "select name from sqlite_master where name in ('files','search','meta')",
  ).map((r) => r[0]);
  for (const t of ['files', 'search', 'meta']) {
    if (!names.includes(t)) {
      throw new Error("This doesn't look like a rules snapshot — table '" + t + "' is missing.");
    }
  }
  try {
    db.selectArrays('select count(*) from search where search match ?', ['a']);
  } catch (e) {
    throw new Error('FTS5 search is unavailable in this SQLite build: ' + e.message);
  }
}

/** meta.last_update — the snapshot's own timestamp, as stored (TEXT). */
export function readLastUpdate(db) {
  const rows = db.selectArrays("select value from meta where key='last_update'");
  return rows.length ? rows[0][0] : null;
}

/** Every chapter's annotation state, for seeding the local overlay. */
export function readAllChapters(db) {
  return db.selectArrays(
    'select path, title, folder, flagged, flag_reason, notes_json from files order by path',
  ).map(([path, title, folder, flagged, reason, notesJson]) => ({
    path,
    title: title || basename(path),
    folder: folder || '',
    flagged: !!flagged,
    flagReason: reason || '',
    notes: parseNotes(notesJson),
  }));
}

/** One chapter's body text, from the FTS5 table (files holds no content). */
export function readChapterContent(db, path) {
  const rows = db.selectArrays('select content from search where path = ?', [path]);
  return rows.length ? (rows[0][0] || '') : '';
}

export function parseNotes(notesJson) {
  if (!notesJson) return [];
  try {
    const v = JSON.parse(notesJson);
    return Array.isArray(v) ? v.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function basename(path) {
  const p = String(path || '').split('/').pop() || '';
  return p.replace(/\.md$/i, '');
}

/**
 * Turn whatever the user typed into a valid FTS5 MATCH expression.
 *
 * Raw input cannot go into MATCH: an unbalanced quote, a trailing `-`, or a
 * bare AND/OR/NEAR raises an SQL error, so ordinary typing would break search
 * mid-word. Every token is quoted (making operators literal), and the last
 * bare token gets a `*` so results narrow as you type.
 *
 * Returns null when there's nothing searchable, so callers can show the
 * browse list instead of running an empty query.
 */
export function buildMatchQuery(input, { prefixLast = true } = {}) {
  const raw = String(input || '');
  if (!raw.trim()) return null;

  const parts = [];
  // Pull out "quoted phrases" first so their spaces survive tokenizing.
  const phraseRe = /"([^"]*)"/g;
  let m;
  let rest = raw;
  const phrases = [];
  while ((m = phraseRe.exec(raw)) !== null) phrases.push(m[1]);
  rest = raw.replace(phraseRe, ' ');

  for (const phrase of phrases) {
    const cleaned = sanitizeToken(phrase);
    if (cleaned) parts.push({ text: cleaned, phrase: true, col: null });
  }

  for (const tok of rest.split(/\s+/)) {
    if (!tok) continue;
    const colMatch = /^(title|content|notes):(.*)$/i.exec(tok);
    const col = colMatch ? colMatch[1].toLowerCase() : null;
    const body = colMatch ? colMatch[2] : tok;
    const cleaned = sanitizeToken(body);
    if (cleaned) parts.push({ text: cleaned, phrase: false, col });
  }

  if (!parts.length) return null;

  // Prefix-match the final bare token, unless the user typed a trailing space
  // (which reads as "that word is finished").
  const endsOpen = !/\s$/.test(raw);
  return parts.map((p, i) => {
    const last = i === parts.length - 1;
    const star = (prefixLast && last && !p.phrase && endsOpen) ? '*' : '';
    const quoted = '"' + p.text.replace(/"/g, '""') + '"';
    return (p.col ? p.col + ':' : '') + quoted + star;
  }).join(' ');
}

/**
 * Strip characters FTS5 treats as syntax. Letters, digits and marks from any
 * script are kept — the corpus has accented text and the tokenizer folds
 * diacritics, so `deja` must still be able to reach `déjà`.
 */
function sanitizeToken(s) {
  return String(s)
    .replace(/[^\p{L}\p{N}\p{M}'\-_ ]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Full-text search. Returns ranked hits with a highlighted excerpt.
 * Throws nothing on bad input — buildMatchQuery has already made it safe.
 */
export function search(db, input, { limit = 100 } = {}) {
  const match = buildMatchQuery(input);
  if (!match) return [];
  const sql =
    'select path, title, folder, ' +
    `  snippet(search, ${COL_CONTENT}, '${HL_OPEN}', '${HL_CLOSE}', '…', 14), ` +
    `  snippet(search, ${COL_TITLE}, '${HL_OPEN}', '${HL_CLOSE}', '', 12) ` +
    'from search where search match ? ' +
    `order by bm25(search, ${BM25_WEIGHTS}) limit ?`;
  let rows;
  try {
    rows = db.selectArrays(sql, [match, limit]);
  } catch (e) {
    // A construct we failed to neutralise — treat as "no results" rather than
    // blowing up the UI.
    return [];
  }
  return rows.map(([path, title, folder, excerpt, titleHit]) => ({
    path,
    title: title || basename(path),
    folder: folder || '',
    excerpt: excerpt || '',
    titleHit: titleHit || '',
  }));
}
