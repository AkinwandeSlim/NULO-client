// Service Worker for NuloAfrica Properties - Offline-First Caching
const CACHE_NAME = 'nulo-africa-properties-v1'
const OFFLINE_CACHE = 'nulo-africa-offline-v1'

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/properties',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/api/properties',
  'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12',
  'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12',
  'https://api.mapbox.com/styles/v1/mapbox/light-v11',
  'https://api.mapbox.com/styles/v1/mapbox/dark-v11',
  'https://api.mapbox.com/styles/v1/mapbox/streets-v12'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip chrome-extension requests
  if (request.url.startsWith('chrome-extension://')) return
  
  // Handle API requests with network-first strategy
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(OFFLINE_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Serve from cache if network fails
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('📦 Serving API from cache:', request.url)
                return cachedResponse
              }
              // Return offline fallback for API
              return new Response(
                JSON.stringify({ 
                  error: 'Offline - Using cached data',
                  offline: true,
                  data: []
                }),
                {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                }
              )
            })
        })
    )
    return
  }
  
  // Handle Mapbox tiles with cache-first strategy
  if (request.url.includes('api.mapbox.com')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('🗺️ Serving map tile from cache:', request.url)
            return cachedResponse
          }
          
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone()
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone)
                })
              }
              return response
            })
            .catch(() => {
              console.log('⚠️ Map tile fetch failed, may show blank areas')
            })
        })
    )
    return
  }
  
  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok && request.url.includes(self.location.origin)) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
          .catch(() => {
            // Serve offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html') || new Response(
                '<html><body><h1>Offline</h1><p>You are currently offline. Some features may not be available.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              )
            }
          })
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-properties') {
    event.waitUntil(
      // Sync any pending property actions
      console.log('🔄 Background syncing property data')
    )
  }
})

// Push notifications for property updates
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New properties available in your area!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore Properties',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('NuloAfrica Properties', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/properties')
    )
  }
})
