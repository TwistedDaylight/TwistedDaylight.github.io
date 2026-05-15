const CACHE = 'pocket-pomo-v2';
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
   The page sends TIMER_START with { endTime, title, body }.
   If TimestampTrigger is available (Chrome for Android), the notification is
   scheduled at the OS level and fires even when the SW is killed or the
   screen is off. Otherwise falls back to setTimeout with a visibility guard
   to prevent double-notifications when the app is open.
   TIMER_CANCEL cancels both pending scheduled notifications and any timeout.
── */
let timerTimeout = null;

self.addEventListener('message', async e => {
  if (e.data.type === 'TIMER_START') {
    clearTimeout(timerTimeout);
    timerTimeout = null;

    // Cancel any existing scheduled or already-shown pomo notification
    const old = await self.registration.getNotifications({ tag: 'pomo', includeTriggered: true });
    old.forEach(n => n.close());

    const delay = e.data.endTime - Date.now();
    if (delay <= 0) return;

    const opts = {
      body: e.data.body,
      tag: 'pomo',
      renotify: true,
      icon: './icon.svg',
    };

    if ('TimestampTrigger' in self) {
      // OS-level scheduling — survives SW death and screen-off
      opts.showTrigger = new TimestampTrigger(e.data.endTime);
      await self.registration.showNotification(e.data.title, opts);
    } else {
      // Fallback: setTimeout with visibility guard to avoid double-notification
      timerTimeout = setTimeout(async () => {
        const wc = await self.clients.matchAll({ type: 'window' });
        if (!wc.some(c => c.visibilityState === 'visible')) {
          self.registration.showNotification(e.data.title, opts);
        }
      }, delay);
    }
  }

  if (e.data.type === 'TIMER_CANCEL') {
    clearTimeout(timerTimeout);
    timerTimeout = null;
    const pending = await self.registration.getNotifications({ tag: 'pomo', includeTriggered: true });
    pending.forEach(n => n.close());
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
