// Web Push service worker for MakanKira order reminders (Android/desktop).
self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'MakanKira', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'MakanKira';
  const options = { body: data.body || '', icon: 'icons/Icon-192.png', badge: 'icons/Icon-192.png' };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
