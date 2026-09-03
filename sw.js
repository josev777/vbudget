// VBudget service worker
const VERSION = 'vbudget-v4.6';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(ARCHIVOS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Nunca cachear llamadas a Google ni el chequeo de version
  if (url.includes('googleapis.com') || url.includes('oauth2.google')) return;
  if (url.includes('version.json')) return;
  if (e.request.method !== 'GET') return;

  const esHTML = e.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/');

  if (esHTML) {
    // El HTML nunca sale del cache si hay red: se pide siempre fresco,
    // saltando incluso el cache HTTP del navegador.
    e.respondWith(
      fetch(e.request.url, { cache: 'no-store' })
        .then(resp => {
          if (resp && resp.status === 200) {
            const copia = resp.clone();
            caches.open(VERSION).then(c => c.put('./index.html', copia));
          }
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copia = resp.clone();
          caches.open(VERSION).then(c => c.put(e.request, copia));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'actualizar') self.skipWaiting();
});
