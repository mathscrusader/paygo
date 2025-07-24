"use client"

import { Button } from "@/components/ui/button"

interface LogoutConfirmationProps {
  onConfirm: () => void
  onCancel: () => void
}

export function LogoutConfirmation({ onConfirm, onCancel }: LogoutConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Confirm Logout</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to log out of your account?</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-full"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
