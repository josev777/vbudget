// VBudget service worker
const VERSION = 'vbudget-v4.3';
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

  // Para el HTML: siempre pedir al servidor sin usar el cache del navegador
  const esHTML = e.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/');

  e.respondWith(
    fetch(e.request, esHTML ? { cache: 'reload' } : {})
      .then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copia = resp.clone();
          caches.open(VERSION).then(c => c.put(e.request, copia));
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'actualizar') self.skipWaiting();
});
