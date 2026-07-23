var CACHE_NAME = 'greenroof-v2.34';
var ASSETS = [
  './',
  './index.html',
  './css/main.css?v=2.34',
  './js/gateway.js?v=2.34',
  './js/state.js?v=2.34',
  './js/utils.js?v=2.34',
  './js/ui/cards.js?v=2.34',
  './js/ui/modal.js?v=2.34',
  './js/ui/dashboard.js?v=2.34',
  './js/ui/map-route.js?v=2.34',
  './js/ui/checkin.js?v=2.34',
  './js/ui/common.js?v=2.34',
  './js/api.js?v=2.34',
  './js/auth.js?v=2.34',
  './js/app.js?v=2.34',
  './js/firebase-config.js?v=2.34',
  './js/error-reporter.js?v=2.34',
  './js/locales/zh-TW.js?v=2.34',
  './js/locales/en.js?v=2.34',
  './png.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.warn("PWA install caching warning:", err);
      });
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
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Only intercept same-origin requests (ignore MapTiler, Firebase, FontAwesome, etc.)
  var reqUrl;
  try {
    reqUrl = new URL(event.request.url);
  } catch (e) {
    return;
  }
  if (reqUrl.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          }
        }).catch(function() {
          // Ignore background revalidation failure
        });
        return cachedResponse;
      }
      
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function(err) {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
        // Return empty response for missing static assets instead of uncaught promise rejection
        return new Response('', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});
