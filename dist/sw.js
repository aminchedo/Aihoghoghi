/**
 * Service Worker for Iranian Legal Archive System
 * Provides offline functionality and performance optimization
 */

const CACHE_NAME = 'iranian-legal-archive-v2.0.0';
const STATIC_CACHE = 'static-cache-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-cache-v2.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/Aihoghoghi/',
  '/Aihoghoghi/index.html',
  '/Aihoghoghi/manifest.json',
  '/Aihoghoghi/assets/index.css',
  '/Aihoghoghi/assets/index.js',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { mode: 'no-cors' })));
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
        // Don't fail installation if caching fails
        return Promise.resolve();
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests that aren't from our domain
  if (url.origin !== location.origin && !url.href.includes('fonts.googleapis.com') && !url.href.includes('cdnjs.cloudflare.com')) {
    return;
  }
  
  event.respondWith(
    cacheFirst(request)
      .catch(() => networkFirst(request))
      .catch(() => {
        // Fallback for offline scenarios
        if (request.destination === 'document') {
          return caches.match('/Aihoghoghi/index.html');
        }
        
        // Return a basic offline response for other requests
        return new Response(
          JSON.stringify({
            error: 'Offline',
            message: 'این درخواست در حالت آفلاین قابل دسترسی نیست',
            timestamp: new Date().toISOString()
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            })
          }
        );
      })
  );
});

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('📋 Serving from cache:', request.url);
    return cachedResponse;
  }
  
  throw new Error('Not in cache');
}

/**
 * Network-first strategy with cache fallback
 */
async function networkFirst(request) {
  try {
    console.log('🌐 Fetching from network:', request.url);
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      
      // Clone the response before caching
      const responseClone = networkResponse.clone();
      
      // Cache the response (don't await to avoid blocking)
      cache.put(request, responseClone).catch((error) => {
        console.warn('⚠️ Failed to cache response:', error);
      });
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('🔍 Network failed, trying cache:', request.url);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'legal-document-sync') {
    event.waitUntil(
      syncLegalDocuments()
        .then(() => {
          console.log('✅ Legal documents synced successfully');
        })
        .catch((error) => {
          console.error('❌ Failed to sync legal documents:', error);
        })
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'سیستم آرشیو حقوقی بروزرسانی شد',
    icon: '/Aihoghoghi/manifest.json',
    badge: '/Aihoghoghi/manifest.json',
    vibrate: [200, 100, 200],
    dir: 'rtl',
    lang: 'fa',
    tag: 'legal-archive-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'مشاهده',
        icon: '/Aihoghoghi/manifest.json'
      },
      {
        action: 'dismiss',
        title: 'نادیده گرفتن',
        icon: '/Aihoghoghi/manifest.json'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('آرشیو اسناد حقوقی', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/Aihoghoghi/')
    );
  }
});

// Sync legal documents in background
async function syncLegalDocuments() {
  try {
    // This would normally sync with a backend
    // For now, we'll just update the cache timestamp
    const cache = await caches.open(DYNAMIC_CACHE);
    const syncData = {
      lastSync: new Date().toISOString(),
      status: 'success'
    };
    
    const response = new Response(JSON.stringify(syncData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put('/api/sync-status', response);
    
    return syncData;
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      timestamp: new Date().toISOString()
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
  }
});

// Periodic background tasks
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);
  
  if (event.tag === 'legal-documents-update') {
    event.waitUntil(
      syncLegalDocuments()
        .then(() => {
          console.log('✅ Periodic sync completed');
        })
        .catch((error) => {
          console.error('❌ Periodic sync failed:', error);
        })
    );
  }
});

console.log('🚀 Iranian Legal Archive Service Worker loaded successfully');