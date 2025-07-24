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
import { fetchAirtimeData } from "@/lib/airtime"
import { supabase } from "@/lib/supabase"

interface Network {
  id: number
  code: string
  name: string
}

interface Denomination {
  id: number
  network_id: number
  base_amount_naira: number
  cashback_naira: number
  sort_order: number
}

export default function AirtimePage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  const [userData, setUserData] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)

  const [networks, setNetworks] = useState<Network[]>([])
  const [denoms, setDenoms] = useState<Denomination[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [payIdInput, setPayIdInput] = useState("")
  const [selectedAmountId, setSelectedAmountId] = useState<number | null>(null)

  const [showPayIdError, setShowPayIdError] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [hasPayId, setHasPayId] = useState(false)
  const [userPayIdCode, setUserPayIdCode] = useState<string | null>(null)

  const [showOpayWarning, setShowOpayWarning] = useState(false)
  const [userDiscountPercent, setUserDiscountPercent] = useState<number>(0)

  // load user profile, level, payid, wallet
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
      // discount from upgrade level
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

      // payid
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

      // wallet balance
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

  // load networks & denominations
  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        const { networks, denominations } = await fetchAirtimeData()
        const ordered = [...networks].sort((a, b) => {
          if (a.code === "mtn") return -1
          if (b.code === "mtn") return 1
          return a.name.localeCompare(b.name)
        })
        setNetworks(ordered)
        setDenoms(denominations)
      } catch (e) {
        console.error("Failed to load airtime data:", e)
      }
    })()
  }, [session])

  // Show Opay warning after 2s
  useEffect(() => {
    const t = setTimeout(() => setShowOpayWarning(true), 2000)
    return () => clearTimeout(t)
  }, [])

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 11) setPhoneNumber(value)
  }

  const filteredDenoms = useMemo(
    () => denoms.filter(d => d.network_id === selectedNetwork),
    [denoms, selectedNetwork]
  )

  const selectedDenom = useMemo(
    () => denoms.find(d => d.id === selectedAmountId) || null,
    [denoms, selectedAmountId]
  )

  const effectivePrice = useMemo(() => {
    if (!selectedDenom) return null
    if (!userDiscountPercent) return selectedDenom.base_amount_naira
    const discounted = Math.round(
      selectedDenom.base_amount_naira * (1 - userDiscountPercent / 100)
    )
    return Math.max(discounted, 0)
  }, [selectedDenom, userDiscountPercent])

  const handleBuyAirtime = async () => {
    if (
      !selectedNetwork ||
      !phoneNumber ||
      !payIdInput ||
      !selectedDenom ||
      effectivePrice == null
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
      const { data: wRow, error: wErr } = await supabase
        .from("wallet")
        .select("balance")
        .eq("userid", session.user.id)
        .single()

      if (wErr || !wRow) throw new Error("Unable to read wallet")

      const currentBal = Number(wRow.balance) || 0
      if (currentBal < effectivePrice) {
        alert("Insufficient wallet balance")
        setIsProcessing(false)
        return
      }

      const newBal = currentBal - effectivePrice
      const { error: updErr } = await supabase
        .from("wallet")
        .update({ balance: newBal })
        .eq("userid", session.user.id)
      if (updErr) throw updErr

      setWalletBalance(newBal)

      // Keep local history
      const storedTransactions = localStorage.getItem("paygo-transactions")
      const transactions = storedTransactions ? JSON.parse(storedTransactions) : []
      transactions.push({
        id: Date.now(),
        type: "debit",
        description: `Airtime Purchase - ${
          networks.find(n => n.id === selectedNetwork)?.name || ""
        }`,
        amount: effectivePrice,
        original_amount: selectedDenom.base_amount_naira,
        discount_percent: userDiscountPercent,
        date: new Date().toISOString(),
      })
      localStorage.setItem("paygo-transactions", JSON.stringify(transactions))

      if (userData) {
        const updated = { ...userData, balance: newBal }
        setUserData(updated)
        localStorage.setItem("paygo-user", JSON.stringify(updated))
      }

      alert("Airtime purchase successful!")
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

  const networkButtonClasses = (n: Network, active: boolean) => {
    const base =
      n.code === "mtn"
        ? "bg-yellow-400 text-black"
        : n.code === "airtel"
        ? "bg-red-500 text-white"
        : n.code === "glo"
        ? "bg-green-500 text-white"
        : n.code === "9mobile"
        ? "bg-green-700 text-white"
        : "bg-gray-200 text-gray-800"
    const activeRing = active
      ? "ring-2 ring-offset-2 ring-purple-600"
      : "border border-transparent"
    return `p-3 rounded-lg text-center font-medium transition ${
      active ? "scale-[1.02]" : "hover:opacity-90"
    } ${base} ${activeRing}`
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Airtime</span>
        </Link>

        {/* Transactions Button */}
        <Link href="/airtime/transactions">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-purple-50 text-purple-700"
            title="Transactions"
          >
            <List className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Promo Banner */}
      <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
        <div>
          <span className="font-medium">Enjoy </span>
          <span className="text-yellow-300 font-bold">Airtime Bonuses!</span>
        </div>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold px-6 py-1 h-8 rounded-full">
          GO
        </Button>
      </div>

      {/* Network Selection */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {networks.map(network => {
          const active = selectedNetwork === network.id
          return (
            <button
              key={network.id}
              className={networkButtonClasses(network, active)}
              onClick={() => {
                setSelectedNetwork(network.id)
                setSelectedAmountId(null)
              }}
            >
              {network.name}
            </button>
          )
        })}
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

      {/* Amount Selection */}
      <div className="px-4 mb-4">
        <h3 className="font-medium mb-2">Select Amount</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {filteredDenoms.map(option => {
            const discounted =
              userDiscountPercent > 0
                ? Math.round(
                    option.base_amount_naira * (1 - userDiscountPercent / 100)
                  )
                : option.base_amount_naira
            const isActive = selectedAmountId === option.id
            return (
              <button
                key={option.id}
                className={`p-3 rounded-lg border text-center transition ${
                  isActive
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedAmountId(option.id)}
              >
                <div className="font-bold">₦{discounted.toLocaleString()}</div>
                {userDiscountPercent > 0 &&
                  discounted !== option.base_amount_naira && (
                    <div className="text-[10px] text-gray-500 line-through">
                      ₦{option.base_amount_naira.toLocaleString()}
                    </div>
                  )}
                <div className="text-xs text-gray-500">
                  ₦{option.cashback_naira} Cashback
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* PAY ID Input */}
      <div className="px-4 mt-6">
        <label className="block text-sm font-medium mb-1">
          {hasPayId ? "PAY ID Key" : "Enter PAY ID Key"}
        </label>
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
          onClick={handleBuyAirtime}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg flex items-center justify-center"
          disabled={
            isValidating ||
            isProcessing ||
            !selectedAmountId ||
            !selectedNetwork ||
            !phoneNumber ||
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
            : "Buy Airtime"}
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
