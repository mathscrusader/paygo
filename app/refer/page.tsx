"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Share2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"

export default function ReferPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [copied, setCopied] = useState(false)

  const [referralCode, setReferralCode] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const [referralBalance, setReferralBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [totalReferrals, setTotalReferrals] = useState(0)

  useEffect(() => {
    if (loading) return
    if (!session) {
      router.replace("/login")
      return
    }

    const fetchReferralData = async () => {
      // 1. Get profile info
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code, reward_balance")
        .eq("id", session.user.id)
        .single()

      if (!profile) return

      const code = profile.referral_code
      const balance = profile.reward_balance ?? 0
      const link = `${window.location.origin}/register?ref=${code}`

      setReferralCode(code)
      setReferralBalance(balance)
      setReferralLink(link)

      // 2. Get total referrals
      const { data: referred } = await supabase
        .from("profiles")
        .select("id")
        .eq("referred_by", code)

      setTotalReferrals(referred?.length || 0)

      // 3. Get total earnings
      const { data: rewards } = await supabase
        .from("referralrewards")
        .select("reward_amount")
        .eq("referrer_id", session.user.id)

      const earnings = rewards?.reduce((sum, r) => sum + r.reward_amount, 0) || 0
      setTotalEarnings(earnings)
    }

    fetchReferralData()
  }, [loading, session, router])

  const promotionalText = `Join PayGo and get ₦180,000 welcome bonus instantly! I'm already earning with PayGo. Sign up using my link: ${referralLink}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(promotionalText)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(promotionalText)
    window.open(`https://wa.me/?text=${message}`, "_blank")
  }

  const handleWithdraw = () => {
    router.push("/refer/withdraw")
  }

  if (loading || !session) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Refer & Earn</span>
        </Link>
      </div>

      <div className="p-4 space-y-6">
        {/* Referral Balance Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-1">Referral Balance</h2>
          <div className="text-3xl font-bold mb-4">₦{referralBalance.toLocaleString()}</div>
          <Button onClick={handleWithdraw} className="w-full bg-white text-purple-700 hover:bg-gray-100">
            Withdraw Earnings
          </Button>
        </div>

        {/* Referral Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-lg text-center">
          <Share2 className="h-12 w-12 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Invite Friends & Earn</h2>
          <p className="text-sm">
            Earn ₦5,000 for each friend who signs up using your referral link and purchases a PAY ID.
          </p>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-12"
          >
            <Copy className="h-5 w-5" />
            {copied ? "Copied!" : "Copy Referral Message"}
          </Button>

          <Button
            onClick={handleShareWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 h-12"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
              stroke="currentColor"
              strokeWidth="0"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
            </svg>
            Share via WhatsApp
          </Button>
        </div>

        {/* How It Works */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3">How It Works</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Share your referral link with friends</li>
            <li>Your friend signs up using your link</li>
            <li>When they purchase a PAY ID, you earn ₦5,000</li>
            <li>Your earnings will be added to your referral balance</li>
            <li>Withdraw your earnings to your bank account</li>
          </ol>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{totalReferrals}</div>
            <div className="text-sm text-gray-500">Total Referrals</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">₦{totalEarnings.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Earnings</div>
          </div>
        </div>
      </div>
    </div>
  )
}
