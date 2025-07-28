"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronDown,
  AlertCircle,
  ArrowLeft,
  Hash,
  Building,
  User as UserIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PayIdActivationPopup } from "@/components/pay-id-activation-popup"
import { OpayWarningPopup } from "@/components/opay-warning-popup"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank", "FCMB",
  "GTBank", "Heritage Bank", "Keystone Bank", "Polaris Bank", "Stanbic IBTC",
  "Sterling Bank", "Union Bank", "UBA", "Unity Bank", "Wema Bank", "Zenith Bank",
  "Kuda Bank", "Opay", "Moniepoint", "VFD MFB", "Globus Bank", "Suntrust Bank",
  "Taj Bank", "Rubies Bank", "Sparkle", "Mint Bank", "Eyowo", "FairMoney",
  "PalmPay", "Page Financials", "Carbon", "Providus Bank", "Jaiz Bank",
  "Parallex Bank", "Lotus Bank", "Hope PSB", "MTN MoMo", "Airtel Smartcash"
]

const inactivePayIds = [
  "PAG-827ZKD2NJWQT", "PAG-193BHF9TXLMR", "PAG-504JUE6AGPYD",
  "PAG-738MQK8DLZNV", "PAG-962CRB3VEXJO", "PAG-245LDH4SMKPU",
  "PAG-871TWN9QGBEY", "PAG-309YVF1CJXAT", "PAG-687RPE7NMZLU"
]

export default function WithdrawPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stabilizedRef = useRef(false)

  const [balance, setBalance] = useState<number>(0)
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bank, setBank] = useState(NIGERIAN_BANKS[0])
  const [amount, setAmount] = useState("")

  const [payId, setPayId] = useState("")
  const [hasPayId, setHasPayId] = useState(false)
  const [userPayId, setUserPayId] = useState("")

  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")
  const [showActivationPopup, setShowActivationPopup] = useState(false)
  const [inactivePayId, setInactivePayId] = useState("")
  const [showOpayWarning, setShowOpayWarning] = useState(false)

  useEffect(() => {
    if (loading) return
    if (stabilizedRef.current) return

    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }
    if (!session) {
      redirectTimeoutRef.current = setTimeout(() => {
        if (!session) {
          stabilizedRef.current = true
          router.replace("/login")
        }
      }, 400)
    } else {
      stabilizedRef.current = true
    }

    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      const { data: walletRow } = await supabase
        .from("wallet")
        .select("balance")
        .eq("userid", session.user.id)
        .maybeSingle()

      if (walletRow?.balance !== undefined) {
        setBalance(Number(walletRow.balance))
      } else {
        setBalance(0)
      }
    })()
  }, [session])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      const { data } = await supabase
        .from("payid")
        .select("payid")
        .eq("userid", session.user.id)
        .maybeSingle()

      if (data?.payid) {
        setPayId(data.payid)
        setUserPayId(data.payid)
        setHasPayId(true)
      } else {
        setHasPayId(false)
      }
    })()
  }, [session])

  useEffect(() => {
    if (!session) return
    const t = setTimeout(() => setShowOpayWarning(true), 2000)
    return () => clearTimeout(t)
  }, [session])

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
      .format(amt)
      .replace("NGN", "₦")

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "")
    if (v.length <= 10) setAccountNumber(v)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsValidating(true)

    await new Promise(r => setTimeout(r, 800))

    const inputPayId = payId.toUpperCase().trim()
    const dbPayId = userPayId.toUpperCase().trim()

    if (inactivePayIds.includes(inputPayId)) {
      setInactivePayId(inputPayId)
      setIsValidating(false)
      setShowActivationPopup(true)
      return
    }

    if (!inputPayId || inputPayId !== dbPayId) {
      setError("Invalid PAY ID. Please enter a valid code or buy one to continue.")
      setIsValidating(false)
      return
    }

    const withdrawAmount = Number(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount.")
      setIsValidating(false)
      return
    }

    if (withdrawAmount > balance) {
      setError("Insufficient balance.")
      setIsValidating(false)
      return
    }

    const newBalance = balance - withdrawAmount
    const { error: updateErr } = await supabase
      .from("wallet")
      .update({ balance: newBalance })
      .eq("userid", session.user.id)

    if (updateErr) {
      setError("Failed to update wallet. Try again.")
      setIsValidating(false)
      return
    }

    const { error: insertErr } = await supabase.from("withdrawals").insert([
  {
    user_id: session.user.id,
    amount: withdrawAmount,
    account_name: accountName,
    account_number: accountNumber,
    bank_name: bank,
    method: "bank"
  }
])


    if (insertErr) {
  console.error("SUPABASE INSERT ERROR:", insertErr); // 👈 this will help us see the real issue
  setError("Withdrawal request failed. Please try again.")
  setIsValidating(false)
  return
}



    setBalance(newBalance)

    localStorage.setItem(
      "paygo-withdrawal-data",
      JSON.stringify({
        accountName,
        accountNumber,
        bank,
        amount: withdrawAmount
      })
    )

    setIsValidating(false)
    router.push("/withdraw/loading")
  }

  const handleActivatePayId = () => {
    setShowActivationPopup(false)
    router.push(`/activate-pay-id?payId=${inactivePayId}`)
  }

  if (loading || (session && !stabilizedRef.current)) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!session && stabilizedRef.current) {
    return <div className="p-6 text-center">Redirecting…</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      <div className="flex items-center p-4 bg-purple-600 text-white">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-xl">Transfer To Bank</span>
        </Link>
      </div>

      <div className="p-4 flex-1">
        <h2 className="text-2xl font-bold mb-4">Bank Details</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Account Name"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-purple-200"
            />
          </div>

          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="Account Number (10 digits)"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-orange-200"
            />
          </div>

          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <select
              value={bank}
              onChange={e => setBank(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-purple-200 bg-gray-50"
            >
              {NIGERIAN_BANKS.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-600" />
          </div>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border-2 border-purple-200"
          />

          <div>
            <input
              type="text"
              placeholder={hasPayId ? "PAY ID Auto-filled" : "Enter PAY ID CODE"}
              value={payId}
              onChange={e => setPayId(e.target.value)}
              required
              disabled={hasPayId}
              className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 uppercase"
            />
            <div className="mt-1 flex justify-between items-center">
              {!hasPayId && (
                <Link
                  href="/buy-pay-id"
                  className="text-purple-600 text-sm hover:underline"
                >
                  Buy PAY ID code
                </Link>
              )}
              <Link
                href="/withdraw/how-to"
                className="text-blue-600 text-sm hover:underline"
              >
                How to withdraw
              </Link>
            </div>
            {hasPayId && (
              <p className="text-xs text-green-600 mt-2">
                ✓ PAY ID activated and ready to use
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="py-2">
            <p className="text-lg font-medium">
              Available Balance: {formatCurrency(balance)}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full py-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isValidating}
          >
            {isValidating ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span>Validating PAY ID...</span>
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </div>

      {showActivationPopup && (
        <PayIdActivationPopup
          payId={inactivePayId}
          onClose={() => setShowActivationPopup(false)}
          onActivate={handleActivatePayId}
        />
      )}
      {showOpayWarning && (
        <OpayWarningPopup onClose={() => setShowOpayWarning(false)} />
      )}
    </div>
  )
}
