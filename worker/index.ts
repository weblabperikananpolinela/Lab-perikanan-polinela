/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

// Hapus namespace cache lama setelah service worker v5.0.1 aktif.
// Cache push notification tidak memakai Cache Storage dan tetap dipertahankan.
sw.addEventListener('activate', (event) => {
  const currentPrefixes = [
    'dolphin-',
    'workbox-precache-',
    'start-url',
  ];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              !currentPrefixes.some((prefix) => key.startsWith(prefix)) &&
              /^(next-image|static-image-assets|next-static-js-assets|static-js-assets|static-style-assets|static-font-assets|pages|pages-rsc|pages-rsc-prefetch|apis|cross-origin|next-data|static-data-assets|google-fonts-)/.test(
                key,
              ),
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

sw.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192x192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(sw.clients.openWindow(event.notification.data.url));
  }
});
