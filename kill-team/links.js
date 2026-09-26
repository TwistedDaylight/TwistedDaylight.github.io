/*
 * links.js — Obsidian-style wikilink resolution.
 *
 * Rulebook Markdown cross-references chapters as [[folder/file|label]]. The
 * link target is written the way it reads in the vault on the PC, which does
 * not always match the indexed `files.path` exactly: it may omit the .md
 * extension, omit leading folders, or differ in case. So resolution is a
 * cascade from strictest to loosest, and reports failure rather than guessing
 * wildly.
 *
 * Pure functions only — no DOM, no SQLite — so the matching rules are
 * directly testable, the same way overlay.js is.
 */

/**
 * Split a raw link target into its path part and optional #heading.
 *
 * Handles the ways a target gets mangled on the way here:
 *  - Windows separators, since the vault lives on a PC
 *  - a leading ./ or /, which mean the same thing as neither
 *  - a trailing backslash, which is what's left of Obsidian's `\|` escape
 *    after the link is split on the pipe inside a Markdown table
 */
export function parseTarget(raw) {
  let s = String(raw == null ? '' : raw).trim();
  s = s.replace(/\\+$/, '');          // leftover from an escaped table pipe
  s = s.replace(/\\/g, '/');          // windows separators
  s = s.replace(/^\.?\//, '');        // ./foo and /foo are just foo
  s = s.replace(/\s+/g, ' ').trim();

  let anchor = '';
  const hash = s.indexOf('#');
  if (hash >= 0) {
    anchor = s.slice(hash + 1).trim();
    s = s.slice(0, hash).trim();
  }
  return { target: s, anchor };
}

const stripExt = (s) => s.replace(/\.md$/i, '');
const baseOf = (s) => stripExt(String(s).split('/').pop() || '');

/**
 * Index the snapshot's chapter paths for lookup. Built once per snapshot load.
 * Basename and lowercase keys map to arrays because collisions are normal in a
 * vault (several folders with a "Overview.md").
 */
export function buildLinkIndex(paths) {
  const exact = new Set();
  const lower = new Map();     // lowercased path (no .md) -> [path]
  const byBase = new Map();    // lowercased basename (no .md) -> [path]

  const push = (map, key, value) => {
    const list = map.get(key);
    if (list) list.push(value); else map.set(key, [value]);
  };

  for (const path of paths) {
    exact.add(path);
    push(lower, stripExt(path).toLowerCase(), path);
    push(byBase, baseOf(path).toLowerCase(), path);
  }
  return { exact, lower, byBase, all: [...paths] };
}

/**
 * Resolve a link target to a chapter path, or null.
 *
 * `fromPath` is the chapter the link was written in; it only breaks ties, so
 * a link in the same folder wins over an identically-named chapter elsewhere.
 */
export function resolveLink(index, rawTarget, fromPath = '') {
  const { target } = parseTarget(rawTarget);
  if (!target) return null;

  // 1. Exactly the indexed path, with or without the extension.
  if (index.exact.has(target)) return target;
  if (index.exact.has(target + '.md')) return target + '.md';

  const key = stripExt(target).toLowerCase();

  // 2. Same path, different case.
  const byLower = index.lower.get(key);
  if (byLower && byLower.length) return pick(byLower, fromPath);

  // 3. A trailing slice of the path: [[Core/QB07]] for Rules/Core/QB07.md.
  const suffix = '/' + key;
  const bySuffix = index.all.filter((p) => stripExt(p).toLowerCase().endsWith(suffix));
  if (bySuffix.length) return pick(bySuffix, fromPath);

  // 4. Filename alone — the common Obsidian case.
  const byBase = index.byBase.get(baseOf(target).toLowerCase());
  if (byBase && byBase.length) return pick(byBase, fromPath);

  return null;
}

/**
 * Choose among equally valid matches, deterministically: nearest to the
 * linking chapter, then the shallowest path, then alphabetical. Stable
 * ordering matters more than cleverness — the same link must always land in
 * the same place.
 */
function pick(candidates, fromPath) {
  if (candidates.length === 1) return candidates[0];
  const fromDirs = dirsOf(fromPath);
  return candidates.slice().sort((a, b) => {
    const shared = sharedDepth(dirsOf(b), fromDirs) - sharedDepth(dirsOf(a), fromDirs);
    if (shared) return shared;
    const depth = dirsOf(a).length - dirsOf(b).length;
    if (depth) return depth;
    return a < b ? -1 : a > b ? 1 : 0;
  })[0];
}

function dirsOf(path) {
  const parts = String(path || '').split('/');
  parts.pop();
  return parts;
}

function sharedDepth(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[n].toLowerCase() === b[n].toLowerCase()) n++;
  return n;
}

/**
 * Normalize heading text for #anchor matching — Obsidian anchors are written
 * as they read, so compare loosely on words rather than on a slug format.
 */
export function normalizeHeading(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Label to show when the link didn't specify one. */
export function defaultLabel(rawTarget) {
  const { target, anchor } = parseTarget(rawTarget);
  const base = baseOf(target);
  if (base && anchor) return `${base} › ${anchor}`;
  return base || anchor || rawTarget;
}
