const CACHE_NAME = 'calc-app-v1';
const ASSETS = [
    './',
    './index.html',
    './script.js',
    './list.js',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@300;400;600;700&display=swap'
];

// Install Service Worker
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Fetch Assets (Serve from cache if offline)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});