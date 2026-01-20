// Service Worker for Sum Tile - Caches static assets for offline support and faster loading

const CACHE_NAME = 'sum-tile-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/puzzle.html',
    '/archive.html',
    '/styles.css',
    '/script.js',
    '/puzzle-data-today.js',
    '/puzzle-data-archive.js',
    '/puzzle-data-encoded.js', // Keep for backward compatibility
    '/favicon.png',
    '/favicon.svg',
    '/bg-shapes.svg',
    '/social_share.png',
    '/robots.txt',
    '/sitemap.xml'
];

// Cache all JS modules
const JS_MODULES = [
    '/js/completion.js',
    '/js/archive.js',
    '/js/auto-complete.js',
    '/js/drag-drop.js',
    '/js/feedback.js',
    '/js/hints.js',
    '/js/interaction-state.js',
    '/js/keyboard-input.js',
    '/js/keyboard.js',
    '/js/modals.js',
    '/js/mouse-drag.js',
    '/js/puzzle-core.js',
    '/js/puzzle-state.js',
    '/js/scoring.js',
    '/js/seo.js',
    '/js/streak.js',
    '/js/tile-interactions.js',
    '/js/tile-operations.js',
    '/js/tile-validation.js',
    '/js/touch-drag.js',
    '/js/ui.js',
    '/js/utils.js',
    '/js/puzzle-data-loader.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll([...STATIC_ASSETS, ...JS_MODULES].map(url => {
                    // Handle relative paths - ensure they work from root
                    return url.startsWith('/') ? url : `/${url}`;
                })).catch((error) => {
                    // Log but don't fail if some assets can't be cached
                    console.warn('[Service Worker] Some assets failed to cache:', error);
                });
            })
    );
    // Force activation of new service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Only cache GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests (Google Fonts, Google Analytics, CDN)
    if (url.origin !== location.origin) {
        return;
    }
    
    // Strategy: Cache first, then network
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }
                
                // Fetch from network
                return fetch(request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response (stream can only be consumed once)
                        const responseToCache = response.clone();
                        
                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // If network fails and we have a cached version, return it
                        // This handles offline scenarios
                        return caches.match(request);
                    });
            })
    );
});
