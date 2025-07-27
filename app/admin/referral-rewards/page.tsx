"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function AdminReferralRewardsPage() {
  const [rewards, setRewards] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUnpaidRewards()
  }, [])

  const fetchUnpaidRewards = async () => {
    const { data, error } = await supabase
      .from("ReferralRewards")
      .select(`
        id,
        reward_amount,
        status,
        created_at,
        referrer:referrer_id ( full_name ),
        referred_user:referred_user_id ( full_name ),
        transaction_id
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setRewards(data)
    }
  }

  const markAsPaid = async (id: string) => {
    setLoadingId(id)
    const { error } = await supabase
      .from("ReferralRewards")
      .update({ status: "paid" })
      .eq("id", id)

    if (!error) {
      setRewards(prev => prev.filter(r => r.id !== id))
    } else {
      alert("Failed to mark as paid.")
    }
    setLoadingId(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Unpaid Referral Rewards</h1>

      {rewards.length > 0 ? (
        <ul className="space-y-3">
          {rewards.map(reward => (
            <li
              key={reward.id}
              className="border rounded-lg p-4 bg-white flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="font-semibold text-purple-700">
                  ₦{reward.reward_amount.toLocaleString()} to {reward.referrer?.full_name}
                </p>
                <p className="text-xs text-gray-600">
                  Referred: {reward.referred_user?.full_name || "New User"}
                </p>
                <p className="text-xs text-gray-400">
                  Tx: {reward.transaction_id} — {new Date(reward.created_at).toLocaleDateString()}
                </p>
              </div>

              <Button
                onClick={() => markAsPaid(reward.id)}
                disabled={loadingId === reward.id}
                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm rounded"
              >
                {loadingId === reward.id ? "Processing..." : "Mark as Paid"}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No unpaid rewards available.</p>
      )}
    </div>
  )
}
