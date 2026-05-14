const CACHE = 'pocket-pomo-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

/* ── Install: cache app shell ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: drop old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first for app shell ── */
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

/* ── Timer notification ──
   The page sends TIMER_START with the absolute endTime ms timestamp.
   We set a timeout here as a fallback for when the page is backgrounded.
   The page cancels it (TIMER_CANCEL) if it fires the notification itself.
── */
let timerTimeout = null;

self.addEventListener('message', e => {
  if (e.data.type === 'TIMER_START') {
    clearTimeout(timerTimeout);
    const delay = e.data.endTime - Date.now();
    if (delay > 0) {
      timerTimeout = setTimeout(() => {
        self.registration.showNotification('🍅 Pomo done!', {
          body: 'Great work — time for a break!',
          tag: 'pomo',
          renotify: true,
          icon: './icon.svg',
        });
      }, delay);
    }
  } else if (e.data.type === 'TIMER_CANCEL') {
    clearTimeout(timerTimeout);
    timerTimeout = null;
  }
});

/* ── Notification click: focus or open the app ── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('pocket-pomo') && 'focus' in c) return c.focus();
      }
      return clients.openWindow('./');
    })
  );
});
