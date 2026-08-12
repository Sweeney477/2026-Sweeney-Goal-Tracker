self.addEventListener('push', (event) => {
  let data = {
    title: 'Workout check-in',
    body: 'Did you work out today?',
    url: '/goal/dashboard',
  }

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() }
    }
  } catch (_) {
    // keep defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/goal/icons/icon-192.png',
      badge: '/goal/icons/icon-192.png',
      data: { url: data.url || '/goal/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/goal/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
