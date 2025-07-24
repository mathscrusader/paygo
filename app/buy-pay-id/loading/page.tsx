"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoadingPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if form data exists
    const formData = localStorage.getItem("paygo-pay-id-form")

    if (!formData) {
      router.push("/buy-pay-id")
      return
    }

    // Redirect to bank selection after 3 seconds
    const timer = setTimeout(() => {
      router.push("/buy-pay-id/select-bank")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing your request...</h2>
        <p className="text-gray-600">Please wait while we prepare your payment options</p>
      </div>
    </div>
  )
}
