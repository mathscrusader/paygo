"use client"

import { useState, useCallback } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  showLocalNotification,
} from "@/services/notification-service"

interface NotificationPermissionDialogProps {
  onClose: () => void
}

export function NotificationPermissionDialog({ onClose }: NotificationPermissionDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleRequestPermission = useCallback(async () => {
    setLoading(true)

    try {
      // Request permission using the Notification API
      const permission = await requestNotificationPermission()

      if (permission === "granted") {
        // Subscribe to push notifications
        const subscription = await subscribeToPushNotifications()

        if (subscription) {
          // Store subscription status in localStorage
          localStorage.setItem("paygo-push-subscription", "true")

          // Show a welcome notification
          showLocalNotification("Notifications Enabled", {
            body: "You will now receive updates about new features and important information.",
            data: { url: "/dashboard" },
          })
        }
      }

      // Store permission status regardless of outcome
      localStorage.setItem("paygo-notification-permission", permission)

      // Close the dialog
      onClose()
    } catch (error) {
      console.error("Error setting up notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-lg">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Bell size={32} />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-center mb-2">Enable Notifications</h3>

        <p className="text-gray-600 text-center mb-6">
          Stay updated with new features, promotions, and important updates from PayGo directly on your device.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleRequestPermission}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={loading}
          >
            {loading ? "Enabling..." : "Enable Notifications"}
          </Button>

          <Button onClick={onClose} variant="outline" className="w-full">
            Not Now
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">You can change this setting anytime in your profile</p>
      </div>
    </div>
  )
}
