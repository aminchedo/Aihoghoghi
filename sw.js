/**
 * Service Worker for Iranian Legal Archive System
 * Provides offline capability and caching for better performance
 */

const CACHE_NAME = 'iranian-legal-archive-v1';
const urlsToCache = [
    '/',
    'styles.css',
    'script.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Skip WebSocket requests
    if (event.request.url.includes('/ws')) {
        return;
    }
    
    // Skip API requests from being cached
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(
                    JSON.stringify({ error: 'Network unavailable' }),
                    { 
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request).then((response) => {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    return new Response(
                        `<!DOCTYPE html>
                        <html lang="fa" dir="rtl">
                        <head>
                            <meta charset="UTF-8">
                            <title>آرشیو اسناد حقوقی - آفلاین</title>
                            <style>
                                body { font-family: Tahoma; text-align: center; padding: 50px; }
                                .offline-message { background: #f3f4f6; padding: 30px; border-radius: 10px; }
                            </style>
                        </head>
                        <body>
                            <div class="offline-message">
                                <h1>🔌 اتصال اینترنت قطع است</h1>
                                <p>لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید</p>
                                <button onclick="window.location.reload()">🔄 تلاش مجدد</button>
                            </div>
                        </body>
                        </html>`,
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                }
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        // Handle offline actions when connection is restored
    }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏛️</text></svg>',
            dir: 'rtl',
            lang: 'fa'
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});