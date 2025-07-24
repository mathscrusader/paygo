"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { OpayWarningPopup } from "@/components/opay-warning-popup"

export default function ActivationPaymentPage() {
  const router = useRouter()
  const [activationData, setActivationData] = useState<any>(null)
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showOpayWarning, setShowOpayWarning] = useState(false)

  useEffect(() => {
    // Check if activation data exists
    const storedData = localStorage.getItem("paygo-activation-data")

    if (!storedData) {
      router.push("/dashboard")
      return
    }

    setActivationData(JSON.parse(storedData))

    // Show Opay warning popup after 2 seconds
    const timer = setTimeout(() => {
      setShowOpayWarning(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  const handleCopyAmount = () => {
    navigator.clipboard.writeText("15700")
    setCopiedAmount(true)
    setTimeout(() => setCopiedAmount(false), 2000)
  }

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText("0100563493")
    setCopiedAccount(true)
    setTimeout(() => setCopiedAccount(false), 2000)
  }

  const handleConfirmPayment = () => {
    setIsLoading(true)

    // Simulate loading for 7 seconds then redirect to payment failed
    setTimeout(() => {
      setIsLoading(false)
      router.push("/activate-pay-id/payment-failed")
    }, 7000)
  }

  if (!activationData) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-300 p-4">
        <h1 className="text-lg font-medium">PAY ID Activation Payment</h1>
        <Link href="/dashboard" className="text-red-500 font-medium">
          Cancel
        </Link>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 bg-[#1a237e] rounded-full flex items-center justify-center">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 rounded-full border-2 border-orange-400"></div>
              <div className="absolute inset-1 rounded-full border-2 border-yellow-400 transform rotate-45"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">NGN 15,700</div>
            <div className="text-gray-600 text-sm">PAY ID: {activationData.payId}</div>
          </div>
        </div>

        <p className="text-center text-base mb-4">Complete this bank transfer to activate your PAY ID</p>

        <div className="border border-gray-300 rounded-md overflow-hidden mb-4">
          <div className="bg-gray-100 p-3 space-y-4">
            <div>
              <p className="text-gray-700 mb-1 text-sm">Amount</p>
              <div className="flex items-center justify-between">
                <p className="font-bold">NGN 15,700</p>
                <button onClick={handleCopyAmount} className="bg-orange-400 text-white px-3 py-1 rounded text-sm">
                  {copiedAmount ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-700 mb-1 text-sm flex items-center gap-1">
                <span>🔢</span> Account Number
              </p>
              <div className="flex items-center justify-between">
                <p className="font-bold">0100563493</p>
                <button
                  onClick={handleCopyAccountNumber}
                  className="bg-orange-400 text-white px-3 py-1 rounded text-sm"
                >
                  {copiedAccount ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-700 mb-1 text-sm flex items-center gap-1">
                <span>🏦</span> Bank Name
              </p>
              <p className="font-bold">Sterling Bank</p>
            </div>

            <div>
              <p className="text-gray-700 mb-1 text-sm flex items-center gap-1">
                <span>🚹</span> Account Name
              </p>
              <p className="font-bold">Ebuka Nwite</p>
            </div>
          </div>

          <div className="p-3 border-t border-gray-300">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
              <p className="text-purple-800 text-sm font-medium">Activation Details:</p>
              <p className="text-purple-700 text-sm">PAY ID: {activationData.payId}</p>
              <p className="text-purple-700 text-sm">
                Account: {activationData.accountNumber} - {activationData.bankName}
              </p>
              <p className="text-purple-700 text-sm">Name: {activationData.accountName}</p>
            </div>

            <p className="mb-3 text-sm">
              Complete the bank transfer to activate your PAY ID. Once activated, you can use it for all transactions.
            </p>

            <button
              onClick={handleConfirmPayment}
              disabled={isLoading}
              className="w-full bg-orange-400 hover:bg-orange-500 text-black py-2.5 font-medium text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </div>
              ) : (
                "I have made this bank Transfer"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Opay Warning Popup */}
      {showOpayWarning && <OpayWarningPopup onClose={() => setShowOpayWarning(false)} />}
    </div>
  )
}
