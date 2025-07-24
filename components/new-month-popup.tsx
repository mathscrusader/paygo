"use client"

import { X, Calendar, Gift, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NewMonthPopupProps {
  onClose: () => void
}

export function NewMonthPopup({ onClose }: NewMonthPopupProps) {
  const currentMonth = new Date().toLocaleString("default", { month: "long" })
  const currentYear = new Date().getFullYear()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold">Happy New Month!</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-base font-bold mb-2">
              Welcome to {currentMonth} {currentYear}!
            </h3>
            <p className="text-gray-600 text-sm">
              We're excited to start this new month with you. May this month bring you prosperity, success, and
              countless opportunities to earn more with PayGo!
            </p>
          </div>

          {/* Features highlight */}
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">This Month's Highlights:</span>
            </div>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Enhanced referral rewards</li>
              <li>• New earning opportunities</li>
              <li>• Improved withdrawal process</li>
              <li>• Special monthly bonuses</li>
            </ul>
          </div>

          {/* Action Button */}
          <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 text-white h-10">
            Let's Get Started!
          </Button>

          <p className="text-center text-xs text-gray-500 mt-3">
            Wishing you a month filled with success and prosperity! 🌟
          </p>
        </div>
      </div>
    </div>
  )
}
