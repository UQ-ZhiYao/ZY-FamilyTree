// Zenith Yield service worker: caches the app's own files so it opens offline after the first visit.
// Family data (Supabase) is never cached here.
const CACHE = 'zenith-yield-v4';
const SHELL = [
  './AppLogin.dc.html', './AppCircle.dc.html', './AppTree.dc.html', './AppPhotos.dc.html', './AppProfile.dc.html', './AppAdmin.dc.html',
  './support.js', './zy-store.js', './zy-config.js', './vendor/supabase.js', './manifest.webmanifest',
  './icons/zy-icon-192.png', './icons/zy-icon-512.png', './icons/zy-apple-touch-180.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Pages: network first so families always see fresh data, cached copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('./AppLogin.dc.html'))));
    return;
  }
  if (url.origin === self.location.origin && /\/zy-config\.js$/.test(url.pathname)) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  // Supabase API calls go straight to the network.
  if (/supabase\.(co|in)$/.test(url.hostname) || /\/(rest|auth|storage|realtime)\/v1\//.test(url.pathname)) return;
  // Same-origin files and fonts: serve from cache, refresh in the background.
  if (url.origin === self.location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
