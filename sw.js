// Zenith Yield service worker: caches the app's own files so it opens offline after the first visit.
// Family data (Supabase) is never cached here.
const CACHE = 'zenith-yield-v42';
// Photos and avatars: kept on the device by file name (each upload has its own name, so a saved copy never goes stale).
const MEDIA = 'zenith-media-v1';
const MEDIA_MAX = 400;
const SHELL = [
  './app/Login.dc.html', './app/Circle.dc.html', './app/Tree.dc.html', './app/Photos.dc.html', './app/Chat.dc.html', './app/Profile.dc.html', './app/Admin.dc.html',
  './assets/support.js', './assets/zy-store.js', './assets/zy-config.js', './assets/vendor/supabase.js', './manifest.webmanifest',
  './assets/icons/zy-icon-192.png', './assets/icons/zy-icon-512.png', './assets/icons/zy-apple-touch-180.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== MEDIA).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Family photos and avatars from Supabase Storage: the link carries a changing token, so match on the file path only.
  if (/\/storage\/v1\/object\/(sign|public|authenticated)\//.test(url.pathname)) {
    const key = url.origin + url.pathname.replace('/object/sign/', '/object/').replace('/object/authenticated/', '/object/');
    e.respondWith(caches.open(MEDIA).then((c) => c.match(key).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        c.put(key, res.clone()).then(() => c.keys()).then((ks) => { if (ks.length > MEDIA_MAX) return Promise.all(ks.slice(0, ks.length - MEDIA_MAX).map((k) => c.delete(k))); }).catch(() => {});
      }
      return res;
    }))).catch(() => fetch(req)));
    return;
  }
  // The Supabase library never changes between releases: open it from the saved copy, refresh in the background.
  if (url.origin === self.location.origin && /\/vendor\/supabase\.js$/.test(url.pathname)) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  // Pages: network first so families always see fresh data, cached copy when offline.
  if (req.mode === 'navigate') {
    // Network first, but never keep the person waiting on a slow connection: after 0.6 s the saved copy opens and the fresh one is kept for next time.
    const net = fetch(req).then((res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; });
    const saved = new Promise((r) => setTimeout(r, 600)).then(() => caches.match(req));
    e.respondWith(Promise.race([net.catch(() => null), saved.then((r) => r || net)])
      .then((r) => r || net)
      .catch(() => caches.match(req).then((r) => r || caches.match('./app/Login.dc.html'))));
    return;
  }
  // The app's own pages and scripts: network first, so an update reaches phones on the next open.
  if (url.origin === self.location.origin && /\.(html|js|webmanifest)$/.test(url.pathname)) {
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
