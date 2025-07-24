"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationPermissionProps {
  onClose: () => void
}

export function NotificationPermission({ onClose }: NotificationPermissionProps) {
  const [loading, setLoading] = useState(false)

  const requestPermission = async () => {
    setLoading(true)

    try {
      // Check if the browser supports notifications
      if (!("Notification" in window)) {
        console.log("This browser does not support notifications")
        onClose()
        return
      }

      // Check if permission is already granted
      if (Notification.permission === "granted") {
        await registerServiceWorker()
        localStorage.setItem("paygo-notification-permission", "granted")
        onClose()
        return
      }

      // Request permission
      const permission = await Notification.requestPermission()

      if (permission === "granted") {
        await registerServiceWorker()
        localStorage.setItem("paygo-notification-permission", "granted")
        // Show a welcome notification
        showWelcomeNotification()
      } else {
        localStorage.setItem("paygo-notification-permission", permission)
      }

      onClose()
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    } finally {
      setLoading(false)
    }
  }

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("Service Worker registered with scope:", registration.scope)

        // Subscribe to push notifications
        try {
          // This would typically connect to your push service
          // For demo purposes, we're just logging
          console.log("Ready to receive push notifications")
        } catch (error) {
          console.error("Error subscribing to push notifications:", error)
        }

        return registration
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }
  }

  const showWelcomeNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("Welcome to PayGo!", {
          body: "You will now receive notifications about new features and updates.",
          icon: "/icons/paygo-notification.png",
          badge: "/icons/paygo-badge.png",
        })
      })
    }
  }

  const handleDeny = () => {
    localStorage.setItem("paygo-notification-permission", "denied")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Bell size={24} />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-center mb-2">Enable Notifications</h3>

        <p className="text-gray-600 text-center mb-6">
          Stay updated with new features, promotions, and important updates from PayGo.
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={requestPermission} className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
            {loading ? "Enabling..." : "Enable Notifications"}
          </Button>

          <Button onClick={handleDeny} variant="outline" className="w-full">
            Not Now
          </Button>
        </div>
      </div>
    </div>
  )
}
