const CACHE_NAME = 'math-game-v1';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'css/styles.css',
    'js/app.js',
    'js/game.js',
    'js/levels.js',
    'js/ui.js',
    'js/progress.js',
    'manifest.json',
    'icons/icon.svg',
    'icons/icon-72.png',
    'icons/icon-96.png',
    'icons/icon-128.png',
    'icons/icon-144.png',
    'icons/icon-152.png',
    'icons/icon-167.png',
    'icons/icon-180.png',
    'icons/icon-192.png',
    'icons/icon-384.png',
    'icons/icon-512.png',
    'icons/favicon.ico',
    'icons/favicon-16x16.png',
    'icons/favicon-32x32.png',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install service worker and cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Clone the request because it can only be used once
                const fetchRequest = event.request.clone();

                // Try network first, then cache
                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it can only be used once
                    const responseToCache = response.clone();

                    // Add response to cache
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // If both cache and network fail, return a simple offline page
                if (event.request.mode === 'navigate') {
                    return new Response(
                        `<!DOCTYPE html>
                        <html>
                            <head>
                                <title>Math Game - Offline</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1">
                                <style>
                                    body { 
                                        font-family: system-ui, -apple-system, sans-serif;
                                        padding: 2rem;
                                        text-align: center;
                                        background: #f0f2f5;
                                    }
                                    h1 { color: #4CAF50; }
                                </style>
                            </head>
                            <body>
                                <h1>You're Offline</h1>
                                <p>Please check your internet connection and try again.</p>
                            </body>
                        </html>`,
                        {
                            headers: { 'Content-Type': 'text/html' }
                        }
                    );
                }
                return new Response('Offline');
            })
    );
});
