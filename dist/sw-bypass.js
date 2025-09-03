// sw-bypass.js - Service Worker Bypass for GitHub Pages
// GITHUB PAGES FIX STRATEGY 2: Service worker bypass and cache clearing

console.log('🔧 Service Worker Bypass - Clearing all caches');

// Immediately unregister any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('🗑️ Unregistering service worker:', registration.scope);
      registration.unregister();
    }
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('🗑️ Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    console.log('✅ All caches cleared');
  });
}

// Clear localStorage and sessionStorage
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Local storage cleared');
} catch (e) {
  console.warn('⚠️ Could not clear storage:', e);
}

// Force reload without cache
setTimeout(() => {
  if (window.location.hostname.includes('github.io')) {
    console.log('🔄 Performing hard reload...');
    window.location.reload(true);
  }
}, 1000);