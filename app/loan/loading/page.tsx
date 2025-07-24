"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoanLoadingPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if loan data exists
    const loanData = localStorage.getItem("paygo-loan-data")

    if (!loanData) {
      router.push("/loan")
      return
    }

    // Redirect to payment page after 5 seconds
    const timer = setTimeout(() => {
      router.push("/loan/payment")
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4">
        <h1 className="text-xl font-bold">Processing Loan Application</h1>
      </div>

      {/* Loading Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="animate-spin mb-6">
          <Loader2 className="h-16 w-16 text-purple-600" />
        </div>

        <h2 className="text-xl font-semibold text-center mb-2">Preparing Bank Details</h2>
        <p className="text-gray-500 text-center">Please wait while we set up your payment...</p>

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
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 text-center">
        <p className="text-gray-700 font-medium">PayGo Financial Services LTD</p>
      </div>
    </div>
  )
}
