const CACHE = 'fh-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache cross-origin (Supabase, Google Fonts, etc.)
  if (url.origin !== self.location.origin) return

  // Never cache auth or API routes — always fresh
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/pwa-icon')) return

  // Static Next.js bundles: cache-first (filenames are content-hashed)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          caches.open(CACHE).then(c => c.put(request, response.clone()))
          return response
        })
      })
    )
    return
  }

  // Navigation and everything else: network-first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(CACHE).then(c => c.put(request, response.clone()))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
