# Kill Team Rules — search & annotate

Offline PWA over a pre-built SQLite/FTS5 snapshot (`rules-search.db`) produced by
the PC-side indexer. Search the rulebook, flag rules that look wrong, attach
notes, and export those local changes as JSON for the PC to import later.

No server, no networking. The synced folder (Synology Drive) is the only
transport, and the app just reads and writes files in it.

## How it fits together

| File | Role |
|---|---|
| `db.js` | Deserializes the snapshot into WASM SQLite; FTS5 search, sanitized `MATCH` queries |
| `overlay.js` | Pure annotation logic — seed/re-seed and the export diff |
| `links.js` | Pure wikilink parsing and resolution against the chapter paths |
| `store.js` | IndexedDB (overlay, settings, snapshot byte cache) + File System Access |
| `app.js` | UI and wiring |

`overlay.js` and `links.js` are deliberately free of IndexedDB and DOM so their
rules can be tested directly. Those rules are the fiddly part: see the comments
on `reseedRecord` for why a field the user never touched must adopt the PC's new
value, and why absorbed notes have to drop out of `notesAdded`.

## Wikilinks

Chapter Markdown cross-references other chapters Obsidian-style: `[[target]]`,
`[[target|label]]`, `[[target#heading]]`, `![[embed]]`. These are handled by a
`marked` **inline extension** in `app.js`, not by a regex pass over the source —
the extension runs inside marked's tokenizer, so `[[...]]` inside code spans and
fenced blocks is correctly left alone.

A link target is written as it reads in the vault, which need not match the
indexed `files.path`, so `resolveLink` tries exact path → path + `.md` →
case-insensitive → path suffix → bare filename. Ambiguous matches (several
`Overview.md`) resolve to the one nearest the linking chapter, then the
shallowest, then alphabetically — always deterministically. Targets that resolve
to nothing render dimmed and run a search when tapped.

Embeds render as links rather than inlining the target: annotation granularity
is whole-chapter, and inlining would risk recursion.

## Vendored dependencies

Both are vendored rather than loaded from a CDN because the app has to work
with no connectivity at all.

- `vendor/sqlite3.js` + `vendor/sqlite3.wasm` — **`@sqlite.org/sqlite-wasm` 3.53.4-build1**
- `vendor/marked.js` — **`marked` 18.0.14**

Note: `sql.js`'s prebuilt does **not** include FTS5 (`CREATE VIRTUAL TABLE …
USING fts5` fails with `no such module: fts5`), which is why this uses the
SQLite team's own build. Confirm FTS5 before swapping libraries.

To refresh:

```sh
npm pack @sqlite.org/sqlite-wasm && tar xzf sqlite.org-sqlite-wasm-*.tgz
cp package/dist/index.mjs    vendor/sqlite3.js     # .mjs renamed: avoids MIME
cp package/dist/sqlite3.wasm vendor/sqlite3.wasm   # surprises on GitHub Pages
npm pack marked && tar xzf marked-*.tgz
cp package/lib/marked.esm.js vendor/marked.js
```

Bump `CACHE` in `sw.js` whenever any asset changes, or clients keep the old one.

## Browser support

Requires the File System Access API (`showDirectoryPicker`) — desktop Chrome
and Edge, and Android Chrome where available. On a browser without it the app
shows a capability table naming exactly what is missing instead of failing
silently. There is deliberately no download fallback yet; add one only if a
target device turns out to need it.

## Running locally

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080/`. A secure context is required for the File
System Access API; `localhost` counts as one.
