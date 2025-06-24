
const CACHE_NAME = 'invoicr-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html', // Explicitly cache index.html
  '/index.tsx',  // Assuming this is the main JS entry point
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/logo.png', // Added logo.png
  // Cache Google Font CSS. The font files themselves will be cached by the browser's HTTP cache when requested by this CSS.
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap'
  // Note: External CDN scripts (Tailwind, html2pdf) are not cached by this service worker by default
  // to keep it simple. They will rely on the browser's standard HTTP caching.
];

// Install event: Open cache and add core app files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core files');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache core files:', error);
      })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: Serve cached content when offline
self.addEventListener('fetch', event => {
  // We only want to handle GET requests for our app shell and defined assets
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests (e.g., loading the page), try network first, then cache.
  // This helps ensure users get the latest HTML if online.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network is available, clone the response and cache it for index.html ('/')
          if (response.ok && (event.request.url.endsWith('/') || event.request.url.endsWith('/index.html'))) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve index.html from cache
          return caches.match('/'); 
        })
    );
    return;
  }
  
  // For other requests (assets like JS, CSS, images specified in URLS_TO_CACHE),
  // use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Serve from cache
        }
        // If not in cache, fetch from network.
        // Optionally, you could cache these network responses dynamically here too.
        return fetch(event.request).then(networkResponse => {
            // Example: Cache successfully fetched resources if they are from the same origin or are known CDNs
            // For simplicity, this example doesn't dynamically cache everything, only pre-cached items.
            return networkResponse;
        }); 
      })
      .catch(error => {
        // Fallback for failed fetch, e.g. a generic offline page or image
        // For this app, if an asset isn't in cache and network fails, it will just fail.
        console.warn('Fetch failed; returning offline page instead.', error);
        // You could return a custom offline page/image here if you had one cached.
        // return caches.match('/offline.html'); 
      })
  );
});