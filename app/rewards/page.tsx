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
    amount: ""
  })
  const [message, setMessage] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState({
    amount: 0,
    method: "",
    type: ""
  })

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
    setMessage("")

    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      setMessage("Please enter a valid amount.")
      return
    }

    if (amount > balance) {
      setMessage("Insufficient balance.")
      return
    }

    console.log("=== WITHDRAWAL VALIDATION ===")
    console.log("Available balance:", balance)
    console.log("Requested amount:", amount)
    console.log("New balance would be:", balance - amount)
    console.log("Referrals count:", referrals.length)

    // Check if user qualifies based on any of the three conditions
    const hasFourReferrals = referrals.length >= 4
    const hasMinimumAmount = balance >= 20000
    
    // Check if user has withdrawn previously
    const { data: previousWithdrawals } = await supabase
      .from("withdrawals")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("withdrawal_type", "reward")
    
    const hasWithdrawnPreviously = previousWithdrawals && previousWithdrawals.length > 0

    console.log("Qualification check:", {
      hasFourReferrals,
      hasWithdrawnPreviously,
      hasMinimumAmount
    })

    // User must meet at least one of the three conditions
    if (!hasFourReferrals && !hasWithdrawnPreviously && !hasMinimumAmount) {
      setMessage("You need to meet at least one condition: 4+ referrals, previous withdrawal, or ₦20,000+ balance.")
      return
    }

    if (withdrawToWallet) {
      try {
        console.log("=== WALLET WITHDRAWAL DEBUG ===")
        console.log("User ID:", session.user.id)
        console.log("Amount:", amount)
        console.log("Available Balance:", balance)
        console.log("New Balance:", balance - amount)

        // Validate user session
        if (!session || !session.user || !session.user.id) {
          setMessage("Authentication error: Please sign in again.")
          return
        }

        // First update the reward balance
        console.log("Step 1: Updating reward balance...")
        console.log("Current balance:", balance, "New balance:", balance - amount)
        
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ reward_balance: balance - amount })
          .eq("id", session.user.id)

        if (updateError) {
          console.error("Profile update failed:", {
            error: updateError,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
            message: updateError.message
          })
          
          // Check if it's an RLS error
          if (updateError.code === '42501' || updateError.message.includes('policy')) {
            console.error("RLS Policy violation detected. Please ensure RLS policies are configured correctly.")
            setMessage("Permission denied: Please contact support to enable withdrawal permissions.")
          } else {
            setMessage(`Reward balance update failed: ${updateError.message || updateError.details || 'Database error'}`)
          }
          return
        }

        // Then credit the wallet
        console.log("Step 2: Crediting wallet...")
        const walletAmount = Math.floor(amount)
        console.log("Wallet credit amount:", walletAmount)
        
        const { data: walletResult, error: walletError } = await supabase
          .rpc('credit_user_wallet', {
            user_id: session.user.id,
            amount: walletAmount
          })
        
        if (walletError) {
          console.error("Wallet credit failed:", {
            error: walletError,
            code: walletError.code,
            details: walletError.details,
            hint: walletError.hint,
            message: walletError.message
          })
          setMessage(`Wallet credit failed: ${walletError.message || walletError.details || 'Database error'}`)
          
          // Rollback the reward balance update
          console.log("Rolling back reward balance...")
          await supabase
            .from("profiles")
            .update({ reward_balance: balance })
            .eq("id", session.user.id)
            
          return
        }
        
        console.log("Step 3: Success! Wallet credited:", walletResult)
        setBalance(prev => prev - amount)
        setSuccessData({
          amount: amount,
          method: "Wallet",
          type: "wallet"
        })
        setShowSuccessModal(true)
        setShowForm(false)
        setForm({ accountName: "", bankName: "", accountNumber: "", amount: "" })
        
      } catch (error) {
        console.error("Unexpected error during wallet withdrawal:", error)
        setMessage(`Unexpected error: ${error instanceof Error ? error.message : 'Please check your connection and try again'}`)
        return
      }
      return // Exit after wallet withdrawal
    }

    // Bank withdrawal validation
    if (!form.accountName || !form.bankName || !form.accountNumber) {
      setMessage("Please fill all required bank details.")
      return
    }

    if (form.accountNumber.length !== 10) {
      setMessage("Account number must be exactly 10 digits.")
      return
    }

    // Enhanced bank withdrawal with detailed error handling
    try {
      console.log("=== BANK WITHDRAWAL DEBUG ===")
      console.log("User ID:", session.user.id)
      console.log("Amount:", amount)
      console.log("Bank Details:", {
        accountName: form.accountName,
        bankName: form.bankName,
        accountNumber: form.accountNumber
      })

      // Validate user session
      if (!session || !session.user || !session.user.id) {
        setMessage("Authentication error: Please sign in again.")
        return
      }

      // Step 1: Update reward balance
      console.log("Step 1: Updating reward balance...")
      console.log("Current balance:", balance, "New balance:", balance - amount)
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ reward_balance: balance - amount })
        .eq("id", session.user.id)

      if (updateError) {
        console.error("Profile update failed:", {
          error: updateError,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          message: updateError.message
        })
        
        // Check if it's an RLS error
        if (updateError.code === '42501' || updateError.message.includes('policy')) {
          console.error("RLS Policy violation detected. Please ensure RLS policies are configured correctly.")
          setMessage("Permission denied: Please contact support to enable withdrawal permissions.")
        } else {
          setMessage(`Reward balance update failed: ${updateError.message || updateError.details || 'Database error'}`)
        }
        return
      }

      // Step 2: Create withdrawal record
      console.log("Step 2: Creating withdrawal record...")
      const withdrawalData = {
        user_id: session.user.id,
        amount: amount,
        status: "pending",
        account_name: form.accountName,
        bank_name: form.bankName,
        account_number: form.accountNumber,
        method: "bank",
        withdrawal_type: "reward"
      }
      
      console.log("Withdrawal data:", withdrawalData)
      
      const { error: withdrawalError } = await supabase.from("withdrawals").insert(withdrawalData)

      if (withdrawalError) {
        console.error("Withdrawal creation failed:", {
          error: withdrawalError,
          code: withdrawalError.code,
          details: withdrawalError.details,
          hint: withdrawalError.hint,
          message: withdrawalError.message
        })
        setMessage(`Withdrawal request failed: ${withdrawalError.message || withdrawalError.details || 'Database error'}`)
        
        // Rollback the reward balance update
        console.log("Rolling back reward balance...")
        await supabase
          .from("profiles")
          .update({ reward_balance: balance })
          .eq("id", session.user.id)
            
        return
      }

      console.log("Step 3: Success! Withdrawal request created")
      setBalance(prev => prev - amount)
      setSuccessData({
        amount: amount,
        method: "Bank Transfer",
        type: "bank"
      })
      setShowSuccessModal(true)
      setShowForm(false)
      setForm({ accountName: "", bankName: "", accountNumber: "", amount: "" })
    } catch (error) {
      console.error("Unexpected error during bank withdrawal:", error)
      setMessage(`Unexpected error: ${error instanceof Error ? error.message : 'Please check your connection and try again'}`)
    }
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
                maxLength={10}
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="Enter 10-digit account number"
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Withdrawal Successful!</h3>
            <p className="text-sm text-gray-600 mb-4">
              {successData.type === 'wallet' 
                ? `₦${successData.amount.toLocaleString()} has been credited to your wallet successfully.`
                : `Your withdrawal request of ₦${successData.amount.toLocaleString()} has been submitted successfully. You'll receive your funds within 24-48 hours.`
              }
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
