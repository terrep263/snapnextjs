// SnapWorxx gallery service worker.
// Minimal by design: its only job is to make galleries installable to the
// home screen on Android (Chrome requires a registered SW with a fetch
// handler before it will offer "Install"). We intentionally do NOT cache
// gallery content — galleries update in real time and stale caches would show
// old photos. This is a pass-through worker.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A no-op fetch handler is required for installability. Returning without
// calling respondWith() lets the browser handle every request normally.
self.addEventListener('fetch', () => {
  // pass-through (network as usual)
});
