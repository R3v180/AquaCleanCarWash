/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/client" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, Route } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  const data = event.data.json()
  const title = data.title || 'AquaClean Car Wash'
  const options: NotificationOptions = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const urlToOpen = event.notification.data.url
  event.waitUntil(self.clients.openWindow(urlToOpen))
})

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

const apiRoute = new Route(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api-cache' })
)

const assetsRoute = new Route(
  ({ request }) => ['style', 'script', 'worker', 'image', 'font'].includes(request.destination),
  new CacheFirst({ cacheName: 'static-assets-cache'})
)

const navigationRoute = new Route(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages-cache'})
)

registerRoute(apiRoute)
registerRoute(assetsRoute)
registerRoute(navigationRoute)