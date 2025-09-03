// sw-disabled.js - Disabled Service Worker for troubleshooting
// This service worker immediately unregisters itself to prevent caching issues

console.log('🚫 Service Worker: Disabled mode activated');

// Immediately unregister this service worker
self.addEventListener('install', (event) => {
  console.log('🚫 Service Worker: Auto-unregistering...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚫 Service Worker: Cleaning up and unregistering...');
  
  event.waitUntil(
    Promise.all([
      // Clear all caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Unregister self
      self.registration.unregister().then(() => {
        console.log('✅ Service Worker unregistered successfully');
      })
    ])
  );
});

// Don't handle any fetch events
self.addEventListener('fetch', (event) => {
  // Do nothing - let browser handle all requests normally
  return;
});