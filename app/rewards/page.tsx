"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ReferralRewardsPage() {
  const { session } = useAuth()
  const [rewards, setRewards] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
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

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      const { data, error } = await supabase
        .from("ReferralRewards")
        .select(`
          id, reward_amount, status, created_at,
          referred_user:referred_user_id ( full_name ),
          transaction_id
        `)
        .eq("referrer_id", session.user.id)
        .order("created_at", { ascending: false })

      if (!error && data) setRewards(data)

      const { data: profile } = await supabase
        .from("profiles")
        .select("reward_balance, referral_code")
        .eq("id", session.user.id)
        .single()

      if (profile?.reward_balance != null) setBalance(profile.reward_balance)

      if (profile?.referral_code) {
        const { data: referred } = await supabase
          .from("profiles")
          .select("full_name, created_at, id")
          .eq("referred_by", profile.referral_code)

        if (referred?.length) {
          setReferrals(referred)
        }
      }
    }

    fetchData()
  }, [session])

  const handleWithdraw = async () => {
    const amount = parseInt(form.amount)

    if (isNaN(amount)) {
      setMessage("Please enter a valid amount.")
      return
    }

    if (amount < 20000) {
      const remaining = 20000 - amount
      setMessage(`Minimum withdrawal is ₦20,000. You’re short by ₦${remaining.toLocaleString()}.`)
      return
    }

    if (amount > balance) {
      setMessage("Insufficient balance.")
      return
    }

    if (withdrawToWallet) {
      const { error: walletError } = await supabase.rpc("credit_wallet", {
        user_id: session.user.id,
        amount: amount,
      })
      if (walletError) {
        setMessage("Failed to credit wallet.")
        return
      }
    } else {
      const { error } = await supabase.from("Withdrawals").insert([
        {
          user_id: session.user.id,
          account_name: form.accountName,
          bank_name: form.bankName,
          account_number: form.accountNumber,
          amount: amount,
          status: "pending",
          method: "bank",
        },
      ])
      if (error) {
        setMessage("Failed to submit withdrawal request.")
        return
      }
    }

    await supabase
      .from("profiles")
      .update({ reward_balance: balance - amount })
      .eq("id", session.user.id)

    setBalance(prev => prev - amount)
    setMessage("Withdrawal submitted successfully!")
    setShowForm(false)
    setForm({ accountName: "", bankName: "", accountNumber: "", amount: "" })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
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

      {/* Balance */}
      <div className="mb-6 bg-purple-100 border border-purple-300 text-purple-800 rounded-lg p-4 text-center">
        <p className="text-sm font-medium">Your Referral Balance</p>
        <p className="text-2xl font-bold">₦{balance.toLocaleString()}</p>

        <Button className="mt-3 bg-purple-700 text-white" onClick={() => setShowForm(true)}>
          Withdraw
        </Button>
      </div>

      {/* Withdrawal Form */}
      {showForm && (
        <div className="bg-white p-4 border rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-3">Withdraw Rewards</h2>

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
              />

              <label className="block text-sm font-medium mt-3">Bank Name</label>
              <Input
                value={form.bankName}
                onChange={e => setForm({ ...form, bankName: e.target.value })}
              />

              <label className="block text-sm font-medium mt-3">Account Number</label>
              <Input
                value={form.accountNumber}
                onChange={e => setForm({ ...form, accountNumber: e.target.value })}
              />
            </>
          )}

          {message && <p className="text-sm text-red-600 mt-2">{message}</p>}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 text-white" onClick={handleWithdraw}>
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* Referral List (No subscription status) */}
      {referrals.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">People You Referred</h2>
          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((u, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{u.full_name}</td>
                    <td className="p-2">{new Date(u.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reward History */}
      <h2 className="text-lg font-semibold mt-8 mb-2">Reward History</h2>
      {rewards.length > 0 ? (
        <ul className="space-y-3">
          {rewards.map((reward, i) => (
            <li key={i} className="border rounded p-3 bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-semibold">{reward.referred_user?.full_name || "New user"}</p>
                <p className="text-xs text-gray-500">Tx ID: {reward.transaction_id}</p>
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
                    reward.status === "paid" ? "text-green-600" : "text-yellow-600"
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
