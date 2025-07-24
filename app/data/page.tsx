"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PayIdError } from "@/components/pay-id-error"
import { OpayWarningPopup } from "@/components/opay-warning-popup"
import { useAuth } from "@/app/providers"
import { fetchDataPlans } from "@/lib/data-plans"
import { supabase } from "@/lib/supabase"

interface DataPlanRow {
  id: number
  network_code: string
  size_label: string
  size_mb: number
  duration_label: string
  duration_days: number
  base_price_naira: number
  sort_order: number
}

export default function DataPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  const [userData, setUserData] = useState<any>(null)
  const [plans, setPlans] = useState<DataPlanRow[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [payIdInput, setPayIdInput] = useState("")
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  const [showPayIdError, setShowPayIdError] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [hasPayId, setHasPayId] = useState(false)
  const [userPayIdCode, setUserPayIdCode] = useState<string | null>(null)

  const [showOpayWarning, setShowOpayWarning] = useState(false)
  const [userDiscountPercent, setUserDiscountPercent] = useState<number>(0)
  const [walletBalance, setWalletBalance] = useState<number>(0)

  // Load user / discount / pay id / wallet
  useEffect(() => {
    if (loading) return
    if (!session) {
      router.push("/login")
      return
    }

    const fallbackUser = {
      name:
        session.user.user_metadata?.fullName ||
        session.user.email?.split("@")[0] ||
        "User",
      email: session.user.email || "",
      balance: 0,
      weeklyRewards: 0,
      hasPayId: false,
    }
    setUserData(fallbackUser)

    ;(async () => {
      // discount
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("upgrade_level_id")
        .eq("id", session.user.id)
        .single()

      if (profileRow?.upgrade_level_id) {
        const { data: levelRow } = await supabase
          .from("upgrade_levels")
          .select("discount_percent")
          .eq("id", profileRow.upgrade_level_id)
          .single()
        if (levelRow?.discount_percent) {
          setUserDiscountPercent(Number(levelRow.discount_percent))
        }
      }

      // pay id (from payid table)
      const { data: payRow } = await supabase
        .from("payid")
        .select("payid")
        .eq("userid", session.user.id)
        .maybeSingle()

      if (payRow?.payid) {
        setUserPayIdCode(payRow.payid)
        setHasPayId(true)
        setPayIdInput(payRow.payid)
      }

      // wallet
      const { data: walletRow } = await supabase
        .from("wallet")
        .select("balance")
        .eq("userid", session.user.id)
        .maybeSingle()

      if (walletRow?.balance !== undefined) {
        setWalletBalance(Number(walletRow.balance))
      }
    })()
  }, [loading, session, router])

  // Load plans
  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        const data = await fetchDataPlans()
        setPlans(data)
      } catch (e) {
        console.error("Failed to load data plans:", e)
      }
    })()
  }, [session])

  // Show Opay warning
  useEffect(() => {
    const t = setTimeout(() => setShowOpayWarning(true), 2000)
    return () => clearTimeout(t)
  }, [])

  // Unique networks (ordered)
  const networkOrder = ["Airtel", "MTN", "Glo", "9mobile"]
  const availableNetworks = useMemo(() => {
    const mapped = Array.from(
      new Set(plans.map(p => p.network_code.toLowerCase()))
    ).map(code => {
      if (code === "mtn") return "MTN"
      if (code === "airtel") return "Airtel"
      if (code === "glo") return "Glo"
      if (code === "9mobile") return "9mobile"
      return code
    })
    return networkOrder.filter(n => mapped.includes(n))
  }, [plans])

  // Filtered / selected
  const filteredPlans = useMemo(() => {
    if (!selectedNetwork) return []
    const code = selectedNetwork.toLowerCase()
    return plans.filter(p => p.network_code === code)
  }, [plans, selectedNetwork])

  const selectedPlan = useMemo(
    () => plans.find(p => p.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  )

  const discountedPrice = useMemo(() => {
    if (!selectedPlan) return null
    if (!userDiscountPercent) return selectedPlan.base_price_naira
    return Math.round(
      selectedPlan.base_price_naira * (1 - userDiscountPercent / 100)
    )
  }, [selectedPlan, userDiscountPercent])

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 11) setPhoneNumber(value)
  }

  const handleBuyData = async () => {
    if (
      !selectedNetwork ||
      !phoneNumber ||
      !payIdInput ||
      !selectedPlan ||
      discountedPrice == null
    ) {
      alert("Please fill all required fields")
      return
    }
    if (phoneNumber.length !== 11) {
      alert("Phone number must be 11 digits")
      return
    }

    // Validate PAY ID
    setIsValidating(true)
    await new Promise(r => setTimeout(r, 800))
    if (!userPayIdCode || payIdInput.trim() !== userPayIdCode.trim()) {
      setIsValidating(false)
      setShowPayIdError(true)
      return
    }
    setIsValidating(false)

    // Wallet deduction
    setIsProcessing(true)
    try {
      // re-fetch wallet
      const { data: wRow, error: wErr } = await supabase
        .from("wallet")
        .select("balance")
        .eq("userid", session.user.id)
        .single()

      if (wErr || !wRow) throw new Error("Unable to read wallet")

      const currentBal = Number(wRow.balance) || 0
      if (currentBal < discountedPrice) {
        alert("Insufficient wallet balance")
        setIsProcessing(false)
        return
      }

      const newBal = currentBal - discountedPrice
      const { error: updErr } = await supabase
        .from("wallet")
        .update({ balance: newBal })
        .eq("userid", session.user.id)
      if (updErr) throw updErr

      setWalletBalance(newBal)

      // Local history (optional)
      const storedTransactions = localStorage.getItem("paygo-transactions")
      const transactions = storedTransactions ? JSON.parse(storedTransactions) : []
      transactions.push({
        id: Date.now(),
        type: "debit",
        description: `Data Purchase - ${selectedNetwork} (${selectedPlan.size_label})`,
        amount: discountedPrice,
        original_amount: selectedPlan.base_price_naira,
        discount_percent: userDiscountPercent,
        date: new Date().toISOString(),
      })
      localStorage.setItem("paygo-transactions", JSON.stringify(transactions))

      if (userData) {
        const updated = { ...userData, balance: newBal }
        setUserData(updated)
        localStorage.setItem("paygo-user", JSON.stringify(updated))
      }

      alert("Data purchase successful!")
      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading || (session && !userData)) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!session) return <div className="p-6 text-center">Redirecting...</div>

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Data</span>
        </Link>

        {/* Transactions Button */}
        <Link href="/data/transactions">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-green-50 text-green-700"
            title="Transactions"
          >
            <List className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Promo Banner */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <div>
          <span className="font-medium">Enjoy </span>
          <span className="text-yellow-300 font-bold">Glo&apos;s</span>
          <span className="font-medium"> Amazing 5X Data Bonuses!</span>
        </div>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold px-6 py-1 h-8 rounded-full">
          GO
        </Button>
      </div>

      {/* Network Selection */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {availableNetworks.map(network => (
          <button
            key={network}
            className={`p-3 rounded-lg border text-center ${
              selectedNetwork === network
                ? "border-green-600 bg-green-50"
                : "border-gray-200"
            }`}
            onClick={() => {
              setSelectedNetwork(network)
              setSelectedPlanId(null)
            }}
          >
            {network}
          </button>
        ))}
      </div>

      {/* Phone Number Input */}
      <div className="px-4 mb-4">
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]{11}"
          maxLength={11}
          placeholder="Enter mobile number (11 digits)"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          className="w-full border rounded-lg p-3 placeholder:text-gray-400"
        />
        {phoneNumber.length > 0 && phoneNumber.length < 11 && (
          <p className="text-xs text-red-500 mt-1">
            Phone number must be 11 digits
          </p>
        )}
      </div>

      {/* Data Plan Selection */}
      <div className="px-4 mb-4">
        <h3 className="font-medium mb-2">Select Data Plan</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {filteredPlans.map(plan => {
            const active = selectedPlanId === plan.id
            const discounted =
              userDiscountPercent > 0
                ? Math.round(
                    plan.base_price_naira * (1 - userDiscountPercent / 100)
                  )
                : plan.base_price_naira
            return (
              <button
                key={plan.id}
                className={`p-3 rounded-lg border text-center transition ${
                  active
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <div className="font-bold">₦{discounted.toLocaleString()}</div>
                {userDiscountPercent > 0 &&
                  discounted !== plan.base_price_naira && (
                    <div className="text-[10px] text-gray-500 line-through">
                      ₦{plan.base_price_naira.toLocaleString()}
                    </div>
                  )}
                <div className="text-xs text-gray-500">{plan.size_label}</div>
                <div className="text-xs text-gray-500">
                  {plan.duration_label}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* PAY ID Input */}
      <div className="px-4 mt-6">
        <Input
          type="text"
          placeholder={hasPayId ? "PAY ID Auto-filled" : "Enter PAY ID Key"}
          value={payIdInput}
          onChange={e => setPayIdInput(e.target.value)}
          className="border rounded-lg p-3 mb-2 placeholder:text-gray-400"
          disabled={hasPayId}
        />
        {!hasPayId && (
          <div className="mb-4 flex justify-end">
            <Link
              href="/buy-pay-id"
              className="text-xs text-purple-600 hover:underline"
            >
              Get ID
            </Link>
          </div>
        )}
        {hasPayId && (
          <p className="text-xs text-green-600 mb-4">
            ✓ PAY ID activated and ready to use
          </p>
        )}

        <Button
          onClick={handleBuyData}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg flex items-center justify-center"
          disabled={
            isValidating ||
            isProcessing ||
            !selectedPlanId ||
            !selectedNetwork ||
            phoneNumber.length !== 11 ||
            !payIdInput
          }
        >
          {(isValidating || isProcessing) && (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          )}
          {isValidating
            ? "Validating PAY ID..."
            : isProcessing
            ? "Processing..."
            : "Buy Data"}
        </Button>
      </div>

      {showPayIdError && (
        <PayIdError onClose={() => setShowPayIdError(false)} />
      )}
      {showOpayWarning && (
        <OpayWarningPopup onClose={() => setShowOpayWarning(false)} />
      )}
    </div>
  )
}
