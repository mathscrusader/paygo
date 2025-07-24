"use client"

import { Clock, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WithdrawalSchedulePopupProps {
  onClose: () => void
}

export function WithdrawalSchedulePopup({ onClose }: WithdrawalSchedulePopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Bad Request</h3>
          <p className="text-gray-600">
            Today is not the withdrawal date. Withdrawals are only processed on Saturdays.
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-800 mb-1">Payment Schedule</h4>
              <p className="text-purple-700 text-sm">
                All withdrawals are processed every Saturday between 12:00 PM and 3:00 PM.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700 rounded-full">
          I Understand
        </Button>
      </div>
    </div>
  )
}
