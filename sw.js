var CACHE_NAME = 'green-eaves-v2';
var ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/ui.js',
  './js/api.js',
  './js/auth.js',
  './js/utils.js',
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
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
