/* Network first, cache as a fallback, so deploys and new clips show up right away and the app still opens offline. */
const V = 'founder-reel-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
