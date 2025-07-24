"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WithdrawalSchedulePopup } from "@/components/withdrawal-schedule-popup"

export default function WithdrawReferralPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bank, setBank] = useState("")
  const [showSchedulePopup, setShowSchedulePopup] = useState(false)

  // Referral balance - in a real app, this would come from the backend
  const referralBalance = 5000

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("paygo-user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    setUserData(JSON.parse(storedUser))
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

    // Show the withdrawal schedule popup
    setShowSchedulePopup(true)
  }

  const handleClosePopup = () => {
    setShowSchedulePopup(false)
    router.push("/refer")
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

  if (!userData) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-purple-600 text-white">
        <Link href="/refer" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-xl">Withdraw Referral Earnings</span>
        </Link>
      </div>

      {/* Balance Card */}
      <div className="m-4 p-4 bg-purple-50 border border-purple-100 rounded-lg">
        <div className="text-sm text-purple-700 mb-1">Available Balance</div>
        <div className="text-2xl font-bold text-purple-800">₦{referralBalance.toLocaleString()}</div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
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

        <Button
          onClick={handleSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg mt-4"
        >
          Submit Withdrawal Request
        </Button>
      </div>

      {/* Withdrawal Schedule Popup */}
      {showSchedulePopup && <WithdrawalSchedulePopup onClose={handleClosePopup} />}
    </div>
  )
}
