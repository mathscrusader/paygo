"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Referral {
  id: string
  full_name: string
  created_at: string
}

export default function ReferralRewardsPage() {
  const { session } = useAuth()
  const [rewards, setRewards] = useState<any[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [balance, setBalance] = useState<number>(0)
  const [showForm, setShowForm] = useState(false)
  const [withdrawToWallet, setWithdrawToWallet] = useState(false)
  const [form, setForm] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    amount: "",
  })
  const [message, setMessage] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      // 1. Reward history
      const { data: rewardsData } = await supabase
        .from("ReferralRewards")
        .select(`
          id,
          reward_amount,
          status,
          created_at,
          referred_user:referred_user_id ( full_name ),
          transaction_id
        `)
        .eq("referrer_id", session.user.id)
        .order("created_at", { ascending: false })
      if (rewardsData) setRewards(rewardsData)

      // 2. Balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("reward_balance")
        .eq("id", session.user.id)
        .single()
      if (profile?.reward_balance != null) {
        setBalance(profile.reward_balance)
      }

      // 3. People You Referred
      const { data: referralRows } = await supabase
        .from("ReferralRewards")
        .select("referred_user_id")
        .eq("referrer_id", session.user.id)
      const referredIds = referralRows?.map(r => r.referred_user_id) || []
      if (referredIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, created_at")
          .in("id", referredIds)
        if (profilesData) {
          setReferrals(
            profilesData.map(p => ({
              id: p.id,
              full_name: p.full_name,
              created_at: p.created_at,
            }))
          )
        }
      }
    }

    fetchData()
  }, [session])

  // auto-clear toast after 3s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleWithdraw = async () => {
    setIsWithdrawing(true)
    setMessage("")

    const amount = parseInt(form.amount, 10)
    if (isNaN(amount)) {
      setMessage("Please enter a valid amount.")
      setIsWithdrawing(false)
      setToast({ text: "Invalid amount", type: "error" })
      return
    }
    if (amount < 20000) {
      const remaining = 20000 - amount
      const msg = `Minimum withdrawal is ₦20,000. You’re short by ₦${remaining.toLocaleString()}.`
      setMessage(msg)
      setIsWithdrawing(false)
      setToast({ text: msg, type: "error" })
      return
    }
    if (amount > balance) {
      const msg = "Insufficient balance."
      setMessage(msg)
      setIsWithdrawing(false)
      setToast({ text: msg, type: "error" })
      return
    }

    try {
      if (withdrawToWallet) {
        const { error: walletError } = await supabase.rpc("credit_wallet", {
          user_id: session.user.id,
          amount,
        })
        if (walletError) throw walletError
      } else {
        if (!form.accountName || !form.bankName || !form.accountNumber) {
          const msg = "Please fill in all bank details to withdraw to your account."
          setMessage(msg)
          setToast({ text: msg, type: "error" })
          setIsWithdrawing(false)
          return
        }
        const { error: rpcError } = await supabase.rpc("request_withdrawal", {
          p_user_id:        session.user.id,
          p_amount:         amount,
          p_account_name:   form.accountName.trim(),
          p_bank_name:      form.bankName.trim(),
          p_account_number: form.accountNumber.trim(),
        })
        if (rpcError) throw rpcError
      }

      setBalance(prev => prev - amount)
      const successMsg = "Withdrawal submitted successfully!"
      setMessage(successMsg)
      setToast({ text: successMsg, type: "success" })
      setShowForm(false)
      setForm({ accountName: "", bankName: "", accountNumber: "", amount: "" })
    } catch (err: any) {
      console.error("Withdrawal error:", err)
      const errMsg = err.message || "Failed to submit withdrawal request."
      setMessage(errMsg)
      setToast({ text: errMsg, type: "error" })
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Back Arrow */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => window.history.back()}
          className="text-purple-700 hover:text-purple-900"
          aria-label="Go back"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Referral Rewards</h1>
      </div>

      {/* Balance Card */}
      <div className="mb-6 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg p-4 text-center">
        <p className="text-sm font-medium">Your Referral Balance</p>
        <p className="text-2xl font-semibold">₦{balance.toLocaleString()}</p>
        <Button
          className="mt-3 bg-purple-700 text-white rounded-full px-6"
          onClick={() => setShowForm(true)}
        >
          Withdraw
        </Button>
      </div>

      {/* People You Referred */}
      {referrals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">People You Referred</h2>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((u, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{u.full_name}</td>
                    <td className="p-2">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Withdrawal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Withdraw Rewards</h2>
            <label className="block text-sm font-medium mb-1">Amount to Withdraw</label>
            <Input
              type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="mb-3"
            />
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={withdrawToWallet}
                onChange={() => setWithdrawToWallet(!withdrawToWallet)}
              />
              <label className="text-sm">Withdraw to Wallet</label>
            </div>
            {!withdrawToWallet && (
              <>
                <label className="block text-sm font-medium mt-2">Account Name</label>
                <Input
                  value={form.accountName}
                  onChange={e => setForm({ ...form, accountName: e.target.value })}
                  className="mb-2"
                />
                <label className="block text-sm font-medium mt-2">Bank Name</label>
                <Input
                  value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                  className="mb-2"
                />
                <label className="block text-sm font-medium mt-2">Account Number</label>
                <Input
                  value={form.accountNumber}
                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                />
              </>
            )}
            {message && <p className="text-sm text-red-600 mt-2">{message}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 text-white"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? "Processing…" : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reward History */}
      <h2 className="text-lg font-semibold mt-8 mb-2">Reward History</h2>
      {rewards.length > 0 ? (
        <ul className="space-y-3">
          {rewards.map((reward, i) => (
            <li
              key={i}
              className="border rounded p-3 bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {reward.referred_user?.full_name || "New user"}
                </p>
                <p className="text-xs text-gray-500">
                  Tx ID: {reward.transaction_id}
                </p>
                <p className="text-xs text-gray-400">
                  Earned: {new Date(reward.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-700">
                  ₦{reward.reward_amount}
                </p>
                <p
                  className={`text-xs font-medium ${
                    reward.status === "paid"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {reward.status.toUpperCase()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No referral rewards yet.</p>
      )}
    </div>
  )
}
