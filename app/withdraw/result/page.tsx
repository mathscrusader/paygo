"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WithdrawalData {
  accountName: string
  accountNumber: string
  bank: string
  amount: number
}

export default function WithdrawResultPage() {
  const router = useRouter()
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData | null>(null)

  useEffect(() => {
    // Check if withdrawal data exists
    const storedWithdrawalData = localStorage.getItem("paygo-withdrawal-data")

    if (!storedWithdrawalData) {
      router.push("/withdraw")
      return
    }

    setWithdrawalData(JSON.parse(storedWithdrawalData))
  }, [router])

  useEffect(() => {
    // Play success sound when the page loads
    const audio = new Audio("/sounds/withdrawal-success.wav")
    audio.play().catch((error) => {
      console.error("Error playing audio:", error)
    })
  }, [])

  const handleBackToDashboard = () => {
    // Clear the withdrawal data
    localStorage.removeItem("paygo-withdrawal-data")
    router.push("/dashboard")
  }

  if (!withdrawalData) {
    return <div className="p-6 text-center">Loading...</div>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("NGN", "₦")
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4">
        <h1 className="text-xl font-bold">Withdrawal Result</h1>
      </div>

      {/* Success Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Withdrawal Successful!</h2>
        <p className="text-gray-500 text-center mb-8">Your withdrawal has been processed successfully.</p>

        <div className="w-full max-w-md bg-gray-50 rounded-lg p-4 mb-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount:</span>
              <span className="font-semibold">{formatCurrency(withdrawalData.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bank:</span>
              <span className="font-semibold">{withdrawalData.bank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Number:</span>
              <span className="font-semibold">{withdrawalData.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Name:</span>
              <span className="font-semibold">{withdrawalData.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID:</span>
              <span className="font-semibold">{`TRX${Date.now().toString().slice(-8)}`}</span>
            </div>
          </div>
        </div>

        <Button onClick={handleBackToDashboard} className="w-full max-w-md bg-purple-600 hover:bg-purple-700">
          Back to Dashboard
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 text-center">
        <p className="text-gray-700 font-medium">PayGo Financial Services LTD</p>
      </div>
    </div>
  )
}
