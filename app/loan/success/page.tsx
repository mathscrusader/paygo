"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoanSuccessPage() {
  const router = useRouter()
  const [loanData, setLoanData] = useState<any>(null)

  useEffect(() => {
    // Check if loan data exists
    const storedLoanData = localStorage.getItem("paygo-loan-data")

    if (!storedLoanData) {
      router.push("/loan")
      return
    }

    const parsedLoanData = JSON.parse(storedLoanData)
    setLoanData(parsedLoanData)

    // Note: We're not adding the loan amount to the user's balance as requested
  }, [router])

  const handleBackToDashboard = () => {
    // Clear the loan data
    localStorage.removeItem("paygo-loan-data")
    router.push("/dashboard")
  }

  if (!loanData) {
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
        <h1 className="text-xl font-bold">Loan Result</h1>
      </div>

      {/* Success Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Loan Approved!</h2>
        <p className="text-gray-500 text-center mb-8">
          Your loan has been approved and will be disbursed to your account shortly.
        </p>

        <div className="w-full max-w-md bg-gray-50 rounded-lg p-4 mb-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Loan Amount:</span>
              <span className="font-semibold">{formatCurrency(loanData.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Loan Type:</span>
              <span className="font-semibold">{loanData.loanType === "free" ? "Free Loan" : "SLF"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bank:</span>
              <span className="font-semibold">{loanData.bank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Number:</span>
              <span className="font-semibold">{loanData.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Name:</span>
              <span className="font-semibold">{loanData.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID:</span>
              <span className="font-semibold">{`LN${Date.now().toString().slice(-8)}`}</span>
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
