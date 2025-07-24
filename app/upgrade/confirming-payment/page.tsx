"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ConfirmingPaymentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Show loading for 5 seconds, then show payment not received
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4">
        <h1 className="text-xl font-bold">Payment Status</h1>
      </div>

      {isLoading ? (
        /* Loading Content */
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="animate-spin mb-6">
            <Loader2 className="h-16 w-16 text-purple-600" />
          </div>

          <h2 className="text-xl font-semibold text-center mb-2">Confirming Your Payment</h2>
          <p className="text-gray-500 text-center">Please wait while we verify your transaction...</p>

          <div className="w-full max-w-md mt-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 animate-progress"
                style={{
                  animation: "progress 5s linear forwards",
                }}
              />
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>This may take a few moments</p>
            <p>Please do not close this page</p>
          </div>
        </div>
      ) : (
        /* Payment Not Received Content */
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="mb-6 bg-red-100 p-4 rounded-full">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>

          <h2 className="text-xl font-semibold text-center mb-2">Payment Not Received</h2>
          <p className="text-gray-500 text-center max-w-md mb-8">
            We couldn't verify your payment. This could be due to a delay in the banking system or the payment wasn't
            completed.
          </p>

          <div className="space-y-4 w-full max-w-md">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium mb-2">What to do next:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">1.</span>
                  <span>Check if the amount was debited from your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">2.</span>
                  <span>If debited, wait a few minutes and check your upgrade status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">3.</span>
                  <span>If not debited, try making the payment again</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/upgrade/payment" className="flex-1">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Retry Payment</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto p-4 text-center">
        <p className="text-gray-700 font-medium">PayGo Financial Services LTD</p>
      </div>
    </div>
  )
}
