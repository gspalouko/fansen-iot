/*
  FANSEN IoT — Service Worker
  Permet l'utilisation hors ligne et l'installation comme app
*/

const CACHE_NAME = 'fansen-iot-v1';
const CACHE_URLS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

/* Installation — mise en cache */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Mise en cache des ressources');
      return cache.addAll(CACHE_URLS).catch(e => console.log('[SW] Cache partiel:', e));
    })
  );
  self.skipWaiting();
});

/* Activation — nettoyage ancien cache */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Interception des requêtes */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase et CDN : toujours réseau en priorité
  if(url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic') || url.includes('jsdelivr') || url.includes('unsplash')){
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Autres ressources : cache en priorité
  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;
      return fetch(event.request).then(response => {
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
