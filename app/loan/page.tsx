"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoanPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loanAmount, setLoanAmount] = useState("")
  const [loanType, setLoanType] = useState<"free" | "slf" | "">("")
  const [showLoanTypeInfo, setShowLoanTypeInfo] = useState(false)
  const [error, setError] = useState("")

  // Loan amount limits
  const MIN_LOAN_AMOUNT = 100000
  const MAX_LOAN_AMOUNT = 250000

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("paygo-user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    setUserData(JSON.parse(storedUser))
  }, [router])

  const handleLoanTypeSelect = (type: "free" | "slf") => {
    setLoanType(type)
    setShowLoanTypeInfo(true)
  }

  const handleCloseLoanTypeInfo = () => {
    setShowLoanTypeInfo(false)

    // Store loan data in localStorage
    localStorage.setItem(
      "paygo-loan-data",
      JSON.stringify({
        loanAmount: Number(loanAmount),
        loanType,
      }),
    )

    // Navigate to bank details page
    router.push("/loan/bank-details")
  }

  const handleContinue = () => {
    // Validate loan amount
    const amount = Number(loanAmount)

    if (!loanAmount) {
      setError("Please enter a loan amount")
      return
    }

    if (amount < MIN_LOAN_AMOUNT) {
      setError(`Minimum loan amount is ₦${MIN_LOAN_AMOUNT.toLocaleString()}`)
      return
    }

    if (amount > MAX_LOAN_AMOUNT) {
      setError(`Maximum loan amount is ₦${MAX_LOAN_AMOUNT.toLocaleString()}`)
      return
    }

    setError("")
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

  if (!userData) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-purple-600 text-white">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-xl">Apply for Loan</span>
        </Link>
      </div>

      {/* Info Alert */}
      <Alert className="mx-4 mt-4 bg-blue-50 border-blue-200 text-blue-800">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>You can borrow between ₦100,000 and ₦250,000.</AlertDescription>
      </Alert>

      {/* Form */}
      <div className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="loanAmount" className="text-gray-700 font-medium">
            Loan Amount
          </label>
          <Input
            id="loanAmount"
            type="number"
            placeholder="Enter amount (₦100,000 - ₦250,000)"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="border-purple-200 rounded-lg p-3 h-14"
          />
          <p className="text-xs text-gray-500">Min: ₦100,000 | Max: ₦250,000</p>
        </div>

        {/* Loan Type Selection */}
        {loanAmount && Number(loanAmount) >= MIN_LOAN_AMOUNT && Number(loanAmount) <= MAX_LOAN_AMOUNT && !loanType && (
          <div className="space-y-2 mt-4">
            <label className="text-gray-700 font-medium">Select Loan Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLoanTypeSelect("free")}
                className={`p-4 rounded-lg border text-center ${
                  loanType === "free" ? "border-purple-600 bg-purple-50" : "border-gray-200"
                }`}
              >
                <div className="font-bold mb-1">Free Loan</div>
                <div className="text-xs text-gray-500">No repayment required</div>
              </button>

              <button
                onClick={() => handleLoanTypeSelect("slf")}
                className={`p-4 rounded-lg border text-center ${
                  loanType === "slf" ? "border-purple-600 bg-purple-50" : "border-gray-200"
                }`}
              >
                <div className="font-bold mb-1">SLF</div>
                <div className="text-xs text-gray-500">5% processing fee</div>
              </button>
            </div>
          </div>
        )}

        {!loanType && (
          <Button
            onClick={handleContinue}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg mt-4"
          >
            Continue
          </Button>
        )}

        {/* Loan Type Info Popup */}
        {showLoanTypeInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-bold">
                  {loanType === "free" ? "Free Loan Information" : "SLF Loan Information"}
                </h3>
              </div>

              {loanType === "free" ? (
                <div className="space-y-3">
                  <p>
                    With the Free Loan option, you will not be required to pay back the loan amount. This is a special
                    offer for our users.
                  </p>
                  <p className="font-medium">Requirements:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You must have a valid PAY ID</li>
                    <li>If you don't have a PAY ID, you can purchase one from the app</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <p>
                    With the SLF (Secured Loan Facility) option, you will need to pay a 5% processing fee of your loan
                    amount.
                  </p>
                  <p className="font-medium">Details:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Processing fee: {loanAmount ? formatCurrency(Number(loanAmount) * 0.05) : "₦0.00"}</li>
                    <li>You will receive the full loan amount after payment</li>
                    <li>No repayment of the loan principal is required</li>
                  </ul>
                </div>
              )}

              <Button
                onClick={handleCloseLoanTypeInfo}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-6"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
