"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"
import { Copy as CopyIcon, Check as CheckIcon, Info } from "lucide-react"

type TxnRow = {
  id: string
  number: string
  status: string | null
  approved: boolean | null
  createdAt: string
}

export default function BuyPayIdPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  const [hasApprovedPayId, setHasApprovedPayId] = useState(false)
  const [payId, setPayId] = useState<string | null>(null)

  const [lastTxn, setLastTxn] = useState<TxnRow | null>(null) // latest activation txn
  const [copied, setCopied] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login")
    }
  }, [loading, session, router])

  // Init user data & check Pay ID / transactions
  useEffect(() => {
    if (loading || !session) return

    ;(async () => {
      // Prefill from local storage or session
      const stored = localStorage.getItem("paygo-user")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.email) setEmail(parsed.email)
          if (parsed.name) setFullName(parsed.name)
        } catch {
          /* ignore */
        }
      } else {
        const fallbackName =
          session.user.user_metadata?.fullName ||
          session.user.email?.split("@")[0] ||
          ""
        setFullName(fallbackName)
        setEmail(session.user.email || "")
      }

      // 1) Check payid table
      const { data: payRow } = await supabase
        .from("payid")
        .select("payid")
        .eq("userid", session.user.id)
        .maybeSingle()

      if (payRow?.payid) {
        setHasApprovedPayId(true)
        setPayId(payRow.payid)
        setInitLoading(false)
        return
      }

      // 2) No payid row yet — fetch latest activation txn to show status
      const { data: txnData } = await supabase
        .from("Transaction")
        .select("id, number, status, approved, createdAt")
        .eq("userId", session.user.id)
        .eq("type", "activation")
        .order("createdAt", { ascending: false })
        .limit(1)

      if (txnData && txnData.length > 0) {
        const tx = txnData[0]
        setLastTxn(tx)

        // If somehow it's approved but payid row didn’t sync (shouldn’t happen, but guard)
        if (tx.approved) {
          setHasApprovedPayId(true)
          setPayId(tx.number)
        }
      }

      setInitLoading(false)
    })()
  }, [loading, session])

  // Copy pay id
  const handleCopy = async () => {
    if (!payId) return
    try {
      await navigator.clipboard.writeText(payId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email) {
      alert("Please fill in all fields")
      return
    }
    localStorage.setItem(
      "paygo-pay-id-form",
      JSON.stringify({ fullName, email })
    )
    router.push("/buy-pay-id/loading")
  }

  if (loading || initLoading) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!session) {
    return <div className="p-6 text-center">Redirecting...</div>
  }

  const renderAlreadyOwned = () => (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 mb-6">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">You already purchased a PAY ID</p>
          <p className="mb-2">
            Your PAY ID is:{" "}
            <span className="font-mono font-semibold text-purple-700">{payId}</span>
          </p>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <CopyIcon className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  const renderTxnStatus = () => {
    if (!lastTxn) return null
    const isPending = !lastTxn.approved && (lastTxn.status ?? "").toUpperCase() === "PENDING"
    const isRejected = (lastTxn.status ?? "").toUpperCase() === "REJECTED"
    const isApproved = !!lastTxn.approved

    const badge = (txt: string, color: string) => (
      <span className={`px-2 py-0.5 text-[11px] rounded-full ${color}`}>{txt}</span>
    )

    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs mb-6">
        <p className="text-gray-700 font-semibold mb-2">Your last PAY ID transaction</p>
        <p className="mb-1">
          Number: <span className="font-mono">{lastTxn.number}</span>
        </p>
        <p className="mb-1">
          Status:{" "}
          {isApproved
            ? badge("APPROVED", "bg-green-100 text-green-700")
            : isRejected
            ? badge("REJECTED", "bg-red-100 text-red-700")
            : badge("PENDING", "bg-yellow-100 text-yellow-700")}
        </p>
        <p className="text-gray-500">
          Date:{" "}
          {new Date(lastTxn.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-[#2e1065] text-white p-4">
        <h1 className="text-xl font-bold">Buy PAY ID</h1>
      </div>

      <div className="p-4 flex-1">
        {/* If already has Pay ID */}
        {hasApprovedPayId ? (
          <>
            {renderAlreadyOwned()}
            {lastTxn && renderTxnStatus()}
            {/* Optionally a button to go back */}
            <Button
              className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 mt-4"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </>
        ) : (
          <>
            {/* Show last txn status if exists (pending/rejected) */}
            {renderTxnStatus()}

            {/* Form to purchase if no approved pay id */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="amount" className="text-gray-700 font-medium">
                  Amount
                </label>
                <Input id="amount" value="₦7,250" disabled className="bg-gray-100 h-12" />
              </div>

              <div className="space-y-2">
                <label htmlFor="fullName" className="text-gray-700 font-medium">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-gray-700 font-medium">
                  Your Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#9333EA] hover:bg-purple-700 text-white h-14 mt-4"
              >
                Pay
              </Button>

              <p className="text-center text-gray-500 mt-4 text-sm">
                Your PAY ID will be displayed on the app once your payment is confirmed.
              </p>
            </form>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 text-center">
        <p className="text-gray-700 font-medium">PayGo Financial Services LTD</p>
      </div>
    </div>
  )
}
