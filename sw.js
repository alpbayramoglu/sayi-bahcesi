// Çevrimdışı oynamak için önbellek.
// Bütün dosyalar tek sürüm olarak birlikte önbelleğe alınır ve hep önbellekten verilir;
// böylece yeni index.html ile eski app.js gibi karışık bir sürüm oluşmaz.
// Her yayında CACHE adını artır: yeni service worker bütün dosyaları birlikte yeniden indirir.
const CACHE = 'sayi-bahcesi-v36';   // app.js içindeki VERSION ile aynı tut
importScripts('audio/clips.js');   // self.CLIPS: tools/make-audio.sh'in ürettiği ses parçaları
const ASSETS = [
  ...self.CLIPS.map(n => `./audio/${n}.mp3`),
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fonts/baloo2-800.woff',
  './savas/',
  './savas/index.html',
  './savas/game.js',
  './sovalye/',
  './sovalye/index.html',
  './img/card-savas.jpg',
  './img/card-yaris3d.jpg',
  './img/card-sovalye.jpg',
  './yaris3d/',
  './yaris3d/index.html',
  './yaris3d/game.js',
  './yaris3d/three.min.js',
  './yaris3d/card.jpg',
  './fonts/exo2-italic-900.woff',
  './fonts/exo2-800.woff',
];

self.addEventListener('install', e => {
  // cache: 'reload' tarayıcının HTTP önbelleğini atlar (GitHub Pages max-age=600 veriyor).
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE)
      .then(c => c.match(req, { ignoreSearch: true }))
      .then(hit => hit || fetch(req))
  );
});
