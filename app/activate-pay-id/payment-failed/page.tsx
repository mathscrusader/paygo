"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function ActivationPaymentFailedPage() {
  const router = useRouter()
  const transactionId = "ACT-" + Date.now().toString().slice(-8)

  const handleRetry = () => {
    router.push("/activate-pay-id/payment")
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
      <h2 className="text-2xl font-bold text-orange-400 mb-4 text-center">PAY ID Activation Failed!</h2>

      <p className="text-center mb-8 max-w-md">
        Your PAY ID activation payment could not be completed. Reason: No Payment received from you/ invalid payment
        method.
      </p>

      {/* Transaction ID Field - No eye view functionality */}
      <div className="w-full max-w-md border border-gray-300 rounded-md p-3 mb-8">
        <div className="font-mono text-center">{transactionId}</div>
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

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          Need help? Contact our support team for assistance with PAY ID activation.
        </p>
      </div>
    </div>
  )
}
