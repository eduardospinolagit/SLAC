// SLAC Service Worker — Push Notifications

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

// Recebe push do servidor
self.addEventListener('push', (e) => {
  if (!e.data) return

  let data = {}
  try {
    data = e.data.json()
  } catch {
    data = { title: 'SLAC', body: e.data.text() }
  }

  const title = data.title || 'SLAC — Sano Lab'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/web-app-manifest-192x192.png',
    badge: data.badge || '/icons/web-app-manifest-192x192.png',
    tag: data.tag || 'slac',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Abrir SLAC' },
      { action: 'dismiss', title: 'Fechar' }
    ]
  }

  e.waitUntil(self.registration.showNotification(title, options))
})

// Clique na notificação
self.addEventListener('notificationclick', (e) => {
  e.notification.close()

  if (e.action === 'dismiss') return

  const url = e.notification.data?.url || '/'

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem uma aba aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Senão abre nova aba
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
