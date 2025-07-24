"use client"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PayIdActivationPopupProps {
  payId: string
  onClose: () => void
  onActivate: () => void
}

export function PayIdActivationPopup({ payId, onClose, onActivate }: PayIdActivationPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 relative animate-in fade-in-0 zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">PAY ID Not Activated</h3>

          <p className="text-sm text-gray-600 mb-4">
            The PAY ID <span className="font-mono font-medium text-purple-600">{payId}</span> is not activated yet.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Activation Fee:</strong> ₦15,700
            </p>
            <p className="text-xs text-yellow-700 mt-1">One-time payment to activate your PAY ID for transactions</p>
          </div>

          <div className="space-y-3">
            <Button onClick={onActivate} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Activate PAY ID
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
