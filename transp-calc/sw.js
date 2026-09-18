const CACHE_PREFIX = 'calc-app-';
const CACHE_NAME = `${CACHE_PREFIX}v10`;
const STATIC_ASSETS = [
    './',
    './index.html',
    './calculator-core.js',
    './script.js',
    './list.js',
    './manifest.json',
    './data/forwarders.json',
    './data/customs-rules.json',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/favicon.ico',
    './font/NotoSansGeorgian-Regular.ttf'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
            await cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
    }
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isSameOrigin = url.origin === self.location.origin;

    if (request.mode === 'navigate') {
        event.respondWith(
            networkFirst(request).catch(() => caches.match('./index.html'))
        );
        return;
    }

    if (isSameOrigin && (url.pathname.endsWith('/data/forwarders.json') || url.pathname.endsWith('/data/customs-rules.json'))) {
        event.respondWith(networkFirst(request));
        return;
    }

    if (isSameOrigin) {
        event.respondWith(networkFirst(request));
    }
});
