// Convert base64 string to Uint8Array for application server key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// This would be your VAPID public key from your push service
// In a real app, this would come from your environment variables
const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers are not supported in this browser")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js")
    console.log("Service Worker registered with scope:", registration.scope)
    return registration
  } catch (error) {
    console.error("Service Worker registration failed:", error)
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications")
    return "denied"
  }

  // Check if permission is already granted
  if (Notification.permission === "granted") {
    return "granted"
  }

  // Request permission using the Notification API
  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    return "denied"
  }
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!("PushManager" in window)) {
    console.log("Push notifications are not supported in this browser")
    return null
  }

  try {
    // Register service worker if not already registered
    const registration = await registerServiceWorker()
    if (!registration) return null

    // Get existing subscription or create a new one
    let subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      console.log("Already subscribed to push notifications")
      return subscription
    }

    // Subscribe to push notifications
    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required for Chrome
      applicationServerKey: convertedVapidKey,
    })

    console.log("Subscribed to push notifications:", subscription)

    // In a real app, you would send this subscription to your server
    // await sendSubscriptionToServer(subscription);

    return subscription
  } catch (error) {
    console.error("Error subscribing to push notifications:", error)
    return null
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) return true

    const result = await subscription.unsubscribe()

    // In a real app, you would notify your server
    // await removeSubscriptionFromServer(subscription);

    return result
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error)
    return false
  }
}

export function showLocalNotification(title: string, options: NotificationOptions = {}): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.log("Cannot show notification: permission not granted")
    return
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: "/icons/paygo-icon.png",
        badge: "/icons/paygo-badge.png",
        vibrate: [100, 50, 100],
        ...options,
      })
    })
  } else {
    // Fallback to regular Notification API
    new Notification(title, {
      icon: "/icons/paygo-icon.png",
      ...options,
    })
  }
}
