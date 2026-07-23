var CACHE_NAME = 'greenroof-v2.29';
var ASSETS = [
  './',
  './index.html',
  './css/main.css?v=2.29',
  './js/gateway.js?v=2.29',
  './js/state.js?v=2.29',
  './js/utils.js?v=2.29',
  './js/ui/cards.js?v=2.29',
  './js/ui/modal.js?v=2.29',
  './js/ui/dashboard.js?v=2.29',
  './js/ui/map-route.js?v=2.29',
  './js/ui/checkin.js?v=2.29',
  './js/ui/common.js?v=2.29',
  './js/api.js?v=2.29',
  './js/auth.js?v=2.29',
  './js/app.js?v=2.29',
  './js/firebase-config.js?v=2.29',
  './js/error-reporter.js?v=2.29',
  './js/locales/zh-TW.js?v=2.29',
  './js/locales/en.js?v=2.29',
  './png.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            console.log('Cleaning old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Only intercept/cache HTTP and HTTPS requests (ignores chrome-extensions, etc.)
  if (!event.request.url.startsWith('http')) return;

  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external APIs (Firebase, Google Maps) to avoid caching errors
  var url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('identitytoolkit.googleapis.com')) return;
  if (url.includes('generativelanguage.googleapis.com') || url.includes('maps.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Stale-while-revalidate: return cached response, update cache in the background
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          }
        }).catch(function() {
          // Ignore background fetch errors
        });
        return cachedResponse;
      }
      
      // If not in cache, fetch from network directly and return it
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function(err) {
        // Safe fallback for navigation requests when offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
        throw err;
      });
    })
  );
});
