"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WithdrawalSchedulePopup } from "@/components/withdrawal-schedule-popup"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"

export default function WithdrawReferralPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bank, setBank] = useState("")
  const [amount, setAmount] = useState("")
  const [referralBalance, setReferralBalance] = useState(0)
  const [showSchedulePopup, setShowSchedulePopup] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (loading) return
    if (!session) {
      router.replace("/login")
      return
    }

    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("reward_balance")
        .eq("id", session.user.id)
        .single()

      if (!error && data?.reward_balance != null) {
        setReferralBalance(data.reward_balance)
      }
    }

    fetchBalance()
  }, [loading, session, router])

  const handleSubmit = async () => {
    setMessage("")

    const withdrawalAmount = parseInt(amount)

    if (!accountName || !accountNumber || !bank) {
      setMessage("Please fill all required fields.")
      return
    }

    if (accountNumber.length !== 10) {
      setMessage("Account number must be 10 digits.")
      return
    }

    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setMessage("Please enter a valid withdrawal amount.")
      return
    }

    // Check if user qualifies for any amount withdrawal
    if (referralBalance < 20000) {
      const shortfall = 20000 - referralBalance
      setMessage(`First withdrawal minimum is ₦20,000. You're short by ₦${shortfall.toLocaleString()}.`)
      return
    }

    if (withdrawalAmount > referralBalance) {
      setMessage("Insufficient balance for this withdrawal amount.")
      return
    }

    // Insert withdrawal request to Supabase for admin to process
    const { error } = await supabase.from("withdrawals").insert([
      {
        user_id: session.user.id,
        account_name: accountName,
        bank_name: bank,
        account_number: accountNumber,
        amount: withdrawalAmount,
        status: "pending",
        method: "bank",
        withdrawal_type: "reward",
      },
    ])

    if (error) {
      setMessage("Failed to submit withdrawal request. Please try again.")
      return
    }

    setShowSchedulePopup(true)
  }

  const handleClosePopup = () => {
    setShowSchedulePopup(false)
    router.push("/refer")
  }

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

  if (loading || !session) {
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
        <p className="text-xs text-gray-600 mt-1">
          Minimum withdrawal amount is ₦20,000.
        </p>
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
              const value = e.target.value
              if (value.length <= 10) setAccountNumber(value)
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
            <SelectContent className="bg-white rounded-lg shadow-md">
              {banks.map((bankName) => (
                <SelectItem
                  key={bankName}
                  value={bankName}
                  className="hover:bg-purple-100 focus:bg-purple-100 transition-colors"
                >
                  {bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-gray-700 font-medium">
            Withdrawal Amount
          </label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount to withdraw"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border-purple-200 rounded-lg p-3 h-14"
            min="1"
            max={referralBalance}
          />
          <p className="text-xs text-gray-500">
            Available: ₦{referralBalance.toLocaleString()}
          </p>
        </div>

        {message && (
          <p className="text-sm text-red-600 mt-2 font-medium">{message}</p>
        )}

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
