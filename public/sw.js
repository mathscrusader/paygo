// Service Worker for Push Notifications
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  return self.clients.claim()
})

// Handle push events (when a notification is pushed from the server)
self.addEventListener("push", (event) => {
  console.log("Push received:", event)

  let notificationData = {}

  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (e) {
      notificationData = {
        title: "New Notification",
        body: event.data.text(),
        icon: "/icons/paygo-icon.png",
      }
    }
  } else {
    notificationData = {
      title: "New Notification",
      body: "You have a new notification from PayGo",
      icon: "/icons/paygo-icon.png",
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || "/icons/paygo-icon.png",
    badge: "/icons/paygo-badge.png",
    data: {
      url: notificationData.url || "/",
    },
    actions: notificationData.actions || [],
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event)
  event.notification.close()

  // Handle action buttons if clicked
  if (event.action) {
    console.log("Action clicked:", event.action)
    // You can handle specific actions here
  }

  // Open the app and navigate to the specified URL
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url === event.notification.data.url && "focus" in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url)
      }
    }),
  )
})
