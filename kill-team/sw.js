/*
 * sw.js — cache-first service worker.
 *
 * The app shell and the SQLite/Markdown wasm+js have to be on the device for
 * this to work on a train with no connectivity, so everything is precached on
 * install. The rules snapshot itself never goes through here: it's read from
 * the synced folder via the File System Access API, not fetched over HTTP.
 *
 * Bump CACHE on every deploy so clients pick up new assets.
 */

const CACHE = 'kt-rules-v3';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './store.js',
  './overlay.js',
  './links.js',
  './manifest.json',
  './icon.svg',
  './vendor/sqlite3.js',
  './vendor/sqlite3.wasm',
  './vendor/marked.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          // Cache same-origin successes so a first visit primes everything.
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Offline and not cached: navigations still get the shell.
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
    }),
  );
});
