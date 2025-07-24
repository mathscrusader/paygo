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

// Static Nigerian banks list (unchanged)
const NIGERIAN_BANKS = [/* same list as before */ 
  "Access Bank","Citibank Nigeria","Ecobank Nigeria","Fidelity Bank","First Bank of Nigeria",
  "First City Monument Bank","Guaranty Trust Bank","Heritage Bank","Keystone Bank","Polaris Bank",
  "Stanbic IBTC Bank","Standard Chartered Bank","Sterling Bank","Union Bank of Nigeria",
  "United Bank for Africa","Unity Bank","Wema Bank","Zenith Bank","Jaiz Bank","Providus Bank",
  "Titan Trust Bank","Globus Bank","SunTrust Bank","Parallex Bank","Premium Trust Bank",
  "Optimus Bank","PalmPay","Kuda Bank","VFD Microfinance Bank","Moniepoint Microfinance Bank",
  "Opay Digital Services","Palmpay","Rubies Microfinance Bank","Sparkle Microfinance Bank",
  "TAJ Bank","TCF Microfinance Bank","Titan Trust Bank","VFD Microfinance Bank","Zenith Bank",
  "Abbey Mortgage Bank","Above Only Microfinance Bank","Accion Microfinance Bank",
  "Ahmadu Bello University Microfinance Bank","Airtel Smartcash PSB","Alphakapital Microfinance Bank",
  "Amju Unique Microfinance Bank","CEMCS Microfinance Bank","Coronation Merchant Bank",
  "Ekondo Microfinance Bank","Eyowo","Fairmoney Microfinance Bank","Firmus Microfinance Bank",
  "FSDH Merchant Bank","Gateway Mortgage Bank","Goodnews Microfinance Bank","Greenwich Merchant Bank",
  "Hackman Microfinance Bank","Hasal Microfinance Bank","HopePSB","Ibile Microfinance Bank",
  "Infinity Microfinance Bank","Lagos Building Investment Company","Links Microfinance Bank",
  "Living Trust Mortgage Bank","Lotus Bank","Mayfair Microfinance Bank","Mint Microfinance Bank",
  "MTN MOMO PSB","NPF Microfinance Bank","Paga","Page Financials","Parkway-ReadyCash","PayCom"
]

// Inactive PAY IDs list (unchanged)
const inactivePayIds = [
  "PAG-827ZKD2NJWQT","PAG-193BHF9TXLMR","PAG-504JUE6AGPYD","PAG-738MQK8DLZNV",
  "PAG-962CRB3VEXJO","PAG-245LDH4SMKPU","PAG-871TWN9QGBEY","PAG-309YVF1CJXAT","PAG-687RPE7NMZLU"
]

// Validation for active PAY ID
const ACTIVE_PAY_ID = "PG-7474PAPAG-827ZKD2NJWQT"
const validatePayIdCode = (code: string) => code === ACTIVE_PAY_ID

interface LocalUser {
  balance: number
  [k: string]: any
}

export default function WithdrawPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  // Auth grace redirect
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stabilizedRef = useRef(false)

  // Local user fallback
  const [localUser, setLocalUser] = useState<LocalUser | null>(null)

  // Form state
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bank, setBank] = useState("Access Bank")
  const [amount, setAmount] = useState("")
  const [payId, setPayId] = useState("")

  // UI state
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")
  const [showActivationPopup, setShowActivationPopup] = useState(false)
  const [inactivePayId, setInactivePayId] = useState("")
  const [showOpayWarning, setShowOpayWarning] = useState(false)

  /** Graceful auth guard */
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

  /** Load local fallback user (balance etc.) once session exists */
  useEffect(() => {
    if (!session) return
    const raw = localStorage.getItem("paygo-user")
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setLocalUser(parsed)
      } catch {
        setLocalUser({ balance: 0 })
      }
    } else {
      setLocalUser({ balance: 0 })
    }
  }, [session])

  /** Timed Opay warning */
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
    if (!localUser) return
    setError("")
    setIsValidating(true)

    // Simulate PAY ID validation delay
    await new Promise(r => setTimeout(r, 4000))

    const upper = payId.toUpperCase()

    // Inactive path
    if (inactivePayIds.includes(upper)) {
      setInactivePayId(upper)
      setIsValidating(false)
      setShowActivationPopup(true)
      return
    }

    // Wrong code
    if (!validatePayIdCode(upper)) {
      setError("Invalid code. Please buy PAY ID code to continue.")
      setIsValidating(false)
      return
    }

    const withdrawAmount = Number(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount.")
      setIsValidating(false)
      return
    }

    if (withdrawAmount > (localUser.balance ?? 0)) {
      setError("Insufficient balance.")
      setIsValidating(false)
      return
    }

    // Persist to temp local storage for next page (until API implemented)
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

  /** Render states */
  if (loading || (session && !localUser && !stabilizedRef.current)) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!session && stabilizedRef.current) {
    return <div className="p-6 text-center">Redirecting…</div>
  }
  if (!session) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!localUser) {
    return <div className="p-6 text-center">Preparing...</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-purple-600 text-white">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-xl">Transfer To Bank</span>
        </Link>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        <h2 className="text-2xl font-bold mb-4">Bank Details</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Name */}
            <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Account Name"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Account Number */}
          <div>
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            {accountNumber.length > 0 && accountNumber.length < 10 && (
              <p className="text-xs text-red-500 mt-1">
                Account number must be 10 digits
              </p>
            )}
          </div>

          {/* Bank Select */}
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <select
              value={bank}
              onChange={e => setBank(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600 appearance-none bg-gray-50"
            >
              {NIGERIAN_BANKS.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-600" />
          </div>

          {/* Amount */}
          <div>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* PAY ID */}
          <div>
            <input
              type="text"
              placeholder="PAY ID CODE (Buy PAY ID)"
              value={payId}
              onChange={e => setPayId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600 uppercase"
            />
            <div className="mt-1 flex justify-between items-center">
              <Link
                href="/buy-pay-id"
                className="text-purple-600 text-sm hover:underline"
              >
                Buy PAY ID code
              </Link>
              <Link
                href="/withdraw/how-to"
                className="text-blue-600 text-sm hover:underline"
              >
                How to withdraw
              </Link>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Balance */}
          <div className="py-2">
            <p className="text-lg font-medium">
              Available Balance: {formatCurrency(localUser.balance ?? 0)}
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full py-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors flex items-center justify-center"
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

      {/* PAY ID Activation Popup */}
      {showActivationPopup && (
        <PayIdActivationPopup
          payId={inactivePayId}
          onClose={() => setShowActivationPopup(false)}
          onActivate={handleActivatePayId}
        />
      )}

      {/* Opay Warning Popup */}
      {showOpayWarning && (
        <OpayWarningPopup onClose={() => setShowOpayWarning(false)} />
      )}
    </div>
  )
}
