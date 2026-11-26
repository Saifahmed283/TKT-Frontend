const CACHE_NAME = 'tkt-pwa-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/tkt-mark.svg', '/apple-touch-icon.png']
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('tkt-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PRECACHE_STATIC' || !Array.isArray(event.data.urls)) return
  const urls = [...new Set(event.data.urls)]
    .filter((value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('/api/') && !value.startsWith('/public/'))
    .filter((value) => /\.(?:js|css|png|svg|webp|woff2?)$/i.test(value))
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(urls.map((value) => cache.add(value))),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  // Reservation and API responses contain private data; never cache them.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/public/')) return
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put('/', response.clone()))
        return response
      }).catch(async () => (await caches.match('/')) || Response.error()),
    )
    return
  }
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
        return response
      }).catch(async () => (await caches.match(request)) || Response.error()),
    )
  }
})
