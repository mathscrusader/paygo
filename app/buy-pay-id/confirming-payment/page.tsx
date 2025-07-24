"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ConfirmingPaymentPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          // Activate PAY ID
          localStorage.setItem("paygo-pay-id-activated", "true")
          // Redirect to success page or dashboard
          setTimeout(() => {
            router.push("/dashboard")
          }, 1000)
          return 100
        }
        return prev + 10
      })
    }, 300)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-[#1a237e] rounded-full flex items-center justify-center mx-auto mb-8">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-orange-400"></div>
            <div className="absolute inset-2 rounded-full border-4 border-yellow-400 transform rotate-45"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming Payment</h1>
        <p className="text-gray-600 mb-8">Please wait while we verify your payment...</p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-orange-400 to-yellow-400 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-500">{progress}% Complete</p>

        {progress === 100 && (
          <div className="mt-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Payment Confirmed!</h2>
            <p className="text-gray-600">Your PAY ID has been activated successfully.</p>
          </div>
        )}
      </div>
    </div>
  )
}
