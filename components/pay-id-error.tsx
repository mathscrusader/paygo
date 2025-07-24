"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PayIdErrorProps {
  onClose: () => void
}

export function PayIdError({ onClose }: PayIdErrorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invalid PAY ID</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            The PAY ID you entered is invalid. Please purchase a valid PAY ID to continue with your withdrawal.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-amber-800 text-sm">
              PAY ID is required for all withdrawals to ensure security and prevent fraud. It costs ₦7,250.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Link href="/buy-pay-id">
              <Button className="bg-purple-600 hover:bg-purple-700 rounded-full">Buy PAY ID</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
