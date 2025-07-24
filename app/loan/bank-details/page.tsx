"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PayIdError } from "@/components/pay-id-error"

export default function LoanBankDetailsPage() {
  const router = useRouter()
  const [loanData, setLoanData] = useState<any>(null)
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bank, setBank] = useState("")
  const [payId, setPayId] = useState("")
  const [showPayIdError, setShowPayIdError] = useState(false)

  // The correct PAY ID
  const CORRECT_PAY_ID = "PG-7474PAYDDT1I2PARFAGSGG"

  useEffect(() => {
    // Check if loan data exists
    const storedLoanData = localStorage.getItem("paygo-loan-data")

    if (!storedLoanData) {
      router.push("/loan")
      return
    }

    setLoanData(JSON.parse(storedLoanData))
  }, [router])

  const handleSubmit = () => {
    if (!accountName || !accountNumber || !bank) {
      alert("Please fill all required fields")
      return
    }

    // Validate account number is exactly 10 digits
    if (accountNumber.length !== 10) {
      alert("Account number must be 10 digits")
      return
    }

    // For Free Loan, check PAY ID
    if (loanData.loanType === "free") {
      if (!payId) {
        alert("Please enter your PAY ID")
        return
      }

      // Check if PAY ID is correct
      if (payId !== CORRECT_PAY_ID) {
        setShowPayIdError(true)
        return
      }
    }

    // Update loan data with bank details
    const updatedLoanData = {
      ...loanData,
      accountName,
      accountNumber,
      bank,
    }

    localStorage.setItem("paygo-loan-data", JSON.stringify(updatedLoanData))

    // Navigate to appropriate page based on loan type
    if (loanData.loanType === "free") {
      // For Free Loan, go directly to success page
      router.push("/loan/success")
    } else {
      // For SLF, go to loading page first
      router.push("/loan/loading")
    }
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

  // Update the banks array with Nigerian banks
  const banks = [
    "Access Bank",
    "Citibank Nigeria",
    "Ecobank Nigeria",
    "Fidelity Bank",
    "First Bank of Nigeria",
    "First City Monument Bank",
    "Guaranty Trust Bank",
    "Heritage Bank",
    "Keystone Bank",
    "Polaris Bank",
    "Stanbic IBTC Bank",
    "Standard Chartered Bank",
    "Sterling Bank",
    "Union Bank of Nigeria",
    "United Bank for Africa",
    "Unity Bank",
    "Wema Bank",
    "Zenith Bank",
    "Kuda Bank",
    "Opay",
    "Palmpay",
  ]

  if (!loanData) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-purple-600 text-white">
        <Link href="/loan" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-xl">Bank Details</span>
        </Link>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-2">Loan Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span>{formatCurrency(loanData.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Loan Type:</span>
              <span>{loanData.loanType === "free" ? "Free Loan" : "SLF"}</span>
            </div>
            {loanData.loanType === "slf" && (
              <div className="flex justify-between">
                <span>Processing Fee (5%):</span>
                <span>{formatCurrency(loanData.loanAmount * 0.05)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="accountName" className="text-gray-700 font-medium">
            Account Name
          </label>
          <Input
            id="accountName"
            type="text"
            placeholder="Enter account name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="border-purple-200 rounded-lg p-3 h-14"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="accountNumber" className="text-gray-700 font-medium">
            Account Number
          </label>
          <Input
            id="accountNumber"
            type="number"
            placeholder="Enter account number"
            value={accountNumber}
            onChange={(e) => {
              // Limit to 10 digits
              const value = e.target.value
              if (value.length <= 10) {
                setAccountNumber(value)
              }
            }}
            className="border-purple-200 rounded-lg p-3 h-14"
            maxLength={10}
            pattern="[0-9]{10}"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bank" className="text-gray-700 font-medium">
            Bank
          </label>
          <Select value={bank} onValueChange={setBank}>
            <SelectTrigger className="border-purple-200 rounded-lg p-3 h-14">
              <SelectValue placeholder="Select Bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bankName) => (
                <SelectItem key={bankName} value={bankName}>
                  {bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PAY ID for Free Loan */}
        {loanData.loanType === "free" && (
          <div className="space-y-2 mt-4">
            <label htmlFor="payId" className="text-gray-700 font-medium">
              PAY ID
            </label>
            <Input
              id="payId"
              type="text"
              placeholder="Enter PAY ID Code"
              value={payId}
              onChange={(e) => setPayId(e.target.value)}
              className="border-purple-200 rounded-lg p-3 h-14"
            />
            <div className="text-purple-600 text-sm">
              Don&apos;t have a PAY ID?{" "}
              <Link href="/buy-pay-id" className="underline">
                Buy PAY ID
              </Link>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg mt-4"
        >
          {loanData.loanType === "free" ? "Apply for Loan" : "Continue to Payment"}
        </Button>
      </div>

      {/* PAY ID Error Popup */}
      {showPayIdError && <PayIdError onClose={() => setShowPayIdError(false)} />}
    </div>
  )
}
