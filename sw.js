var CACHE_NAME = 'greenroof-v2.20';
var ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/gateway.js?v=2.18',
  './js/state.js?v=2.18',
  './js/utils.js?v=2.18',
  './js/ui/cards.js?v=2.18',
  './js/ui/modal.js?v=2.18',
  './js/ui/dashboard.js?v=2.18',
  './js/ui/map-route.js?v=2.18',
  './js/ui/checkin.js?v=2.18',
  './js/ui/common.js?v=2.18',
  './js/api.js?v=2.18',
  './js/auth.js?v=2.18',
  './js/app.js?v=2.18',
  './js/firebase-config.js',
  './js/locales/zh-TW.js',
  './js/locales/en.js',
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
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external APIs (Firebase, etc.) to avoid caching errors
  var url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('identitytoolkit.googleapis.com')) return;
  if (url.includes('generativelanguage.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      var fetchPromise = fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function() {
        return cachedResponse;
      });
      
      return cachedResponse || fetchPromise;
    })
  );
});