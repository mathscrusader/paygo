"use client"
import Image from "next/image"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OpayWarningPopupProps {
  onClose: () => void
}

export function OpayWarningPopup({ onClose }: OpayWarningPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image src="/images/opay-logo.png" alt="Opay Logo" fill className="object-contain" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Service Notice</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Opay Bank Service Down</p>
            <p className="text-amber-700 text-sm mt-1">
              We're currently experiencing issues with Opay bank transfers. Please use other banks for your payments.
            </p>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          We apologize for any inconvenience. All other banks are working normally and your payment will be processed
          immediately.
        </p>

        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 rounded-full">
            I Understand
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OpayWarningPopup
