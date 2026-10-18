// Private workspace data and API responses must NEVER be cached by a service worker.
const CACHE = 'social63-shell-v1.1.0';
const STATIC = ['/', '/assets/app.css?v=1.1.0', '/assets/app.js?v=1.1.0', '/assets/icon.svg', '/assets/icon-192.png', '/assets/icon-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC.filter(x => x !== '/'))).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('.php') || url.pathname === '/' || url.pathname.includes('/storage/')) return;
  if (!url.pathname.startsWith('/assets/')) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if (response.ok) { const clone=response.clone(); caches.open(CACHE).then(c => c.put(request,clone)); } return response; })));
});
