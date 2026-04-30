const CACHE_NAME = 'green-eaves-v1';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/ui.js',
  './js/api.js',
  './js/auth.js',
  './js/utils.js',
  './js/firebase-config.js',
  './png.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
