// This is the service worker script, which listens for push events.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Ensure the service worker takes control of the page immediately.
  event.waitUntil(self.clients.claim());
});

// Listener for simulated push notifications sent from the main app thread.
self.addEventListener('message', (event) => {
  const notificationData = event.data;
  if (notificationData) {
    const { title, message: body, ...options } = notificationData;
    self.registration.showNotification(title, {
      body,
      icon: '/vite.svg', // A default icon
      badge: '/vite.svg', // A default badge for mobile
      ...options,
    });
  }
});

// Listener for real push notifications from a push service.
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received.');
    const pushData = event.data ? event.data.json() : { title: 'vrtelolleva', message: 'You have a new update!' };
    const { title, message: body, ...options } = pushData;

    const promiseChain = self.registration.showNotification(title, {
        body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        ...options
    });

    event.waitUntil(promiseChain);
});


// Handles what happens when a user clicks on the notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window for the app is already open, focus it.
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      // Otherwise, open a new window.
      return clients.openWindow('/');
    })
  );
});
