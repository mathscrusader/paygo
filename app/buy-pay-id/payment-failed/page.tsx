"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentFailedPage() {
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)

  const handleRetry = () => {
    router.push("/buy-pay-id/payment")
  }

  const handleGoHome = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      {/* Red Circle with X */}
      <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>

      {/* Failure Message */}
      <h2 className="text-2xl font-bold text-orange-400 mb-4 text-center">Transaction verification failed!</h2>

      <p className="text-center mb-8 max-w-md">
        Your payment could not be completed. Reason:No Payment received from you/ invalid payment method.
      </p>

      {/* Transaction ID Field */}
      <div className="w-full max-w-md border border-gray-300 rounded-md flex items-center justify-between p-3 mb-8">
        <div className="font-mono">{showDetails ? "Not Available" : "•••••••••••••"}</div>
        <button onClick={() => setShowDetails(!showDetails)} className="text-gray-600">
          {showDetails ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-4">
        <Button onClick={handleRetry} className="w-full bg-purple-600 hover:bg-purple-700">
          Try Again
        </Button>

        <Button onClick={handleGoHome} variant="outline" className="w-full">
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
