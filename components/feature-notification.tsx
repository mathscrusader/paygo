"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeatureNotificationProps {
  onClose: () => void
}

export function FeatureNotification({ onClose }: FeatureNotificationProps) {
  return (
    <div className="fixed inset-x-0 top-0 p-4 z-50">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-4 shadow-lg max-w-md mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Welcome to PayGo!</h3>
            <p className="text-sm text-purple-100">
              We've added new features to enhance your experience. Explore our app to discover all the new
              functionalities.
            </p>
            <div className="mt-3">
              <Button
                onClick={onClose}
                className="bg-white text-purple-700 hover:bg-gray-100 text-sm px-4 py-1 h-8 rounded-full"
              >
                Got it
              </Button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 rounded-full hover:bg-purple-500 transition-colors"
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
