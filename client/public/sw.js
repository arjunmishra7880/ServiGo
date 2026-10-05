// ═══════════════════════════════════════════════════════════════
// ServiGo Service Worker — Instant Booking & Chat Push Notifications
// ═══════════════════════════════════════════════════════════════

const SW_VERSION = 'servigo-sw-v1';

self.addEventListener('install', (event) => {
  // Activate worker immediately once installed
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all active clients so the worker controls pages right away
  event.waitUntil(self.clients.claim());
});

// ── Receive notification requests from SocketContext / client pages ──
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const {
      title = 'ServiGo Notification',
      body = 'You have a new update.',
      icon = '/favicon.svg',
      badge = '/favicon.svg',
      data = {},
      tag = 'servigo-notification'
    } = event.data;

    const notificationOptions = {
      body,
      icon,
      badge,
      tag,
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/bookings',
        bookingId: data.bookingId,
        conversationId: data.conversationId,
        timestamp: Date.now()
      },
      actions: [
        { action: 'view', title: '👀 View Booking' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  }
});

// ── Handle incoming Web Push (if push manager is used) ──
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = {
      title: 'ServiGo Notification',
      body: event.data ? event.data.text() : 'You have a new booking update.'
    };
  }

  const title = payload.title || '📅 New Booking Update!';
  const options = {
    body: payload.body || 'A customer has requested a service.',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'servigo-booking-push',
    renotify: true,
    data: payload.data || { url: '/bookings' },
    actions: [
      { action: 'view', title: 'Open Booking' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Handle click on system notification banner ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/bookings';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (client.url !== targetUrl) {
            client.navigate(targetUrl);
          }
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
