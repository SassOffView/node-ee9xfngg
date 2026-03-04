const CACHE = 'routine-app-v2';

// FIX: lista corretta degli asset da pre-cachare in produzione.
// I file JS/CSS sono gestiti da Vite con hash dinamici, quindi
// in install pre-cachiamo solo lo shell HTML e gli asset statici noti.
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// FIX: skipWaiting dentro waitUntil per garantire la sequenza corretta
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// FIX: pulizia delle vecchie versioni della cache nell'activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// FIX: strategia network-first per i file JS/CSS (con hash, cambiano ad ogni build),
// cache-first per asset statici, fallback su index.html per navigazione SPA
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Ignora richieste non-GET e origini esterne
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Per i bundle JS/CSS compilati da Vite (con hash nel nome): network-first
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      fetch(request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return r;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Per le navigazioni (HTML): tenta rete, fallback su index.html cached
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Per tutto il resto: cache-first con fallback rete
  e.respondWith(
    caches.match(request).then(r => r || fetch(request))
  );
});
