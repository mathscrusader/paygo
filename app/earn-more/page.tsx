"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"

export default function EarnMorePage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [displayName, setDisplayName] = useState("User")
  const [referralCode, setReferralCode] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Graceful auth guard & referral setup
  useEffect(() => {
    if (loading) return

    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }

    if (!session) {
      redirectTimeoutRef.current = setTimeout(() => {
        if (!session) router.replace("/login")
      }, 400)
      return
    }

    const metaName =
      (session.user.user_metadata &&
        (session.user.user_metadata.fullName ||
          session.user.user_metadata.name)) ||
      session.user.email?.split("@")[0] ||
      "User"

    setDisplayName(metaName)

    // Fetch referral code and generate if not set
    const fetchReferralCode = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code, full_name")
        .eq("id", session.user.id)
        .single()

      if (error || !data) return

      if (!data.referral_code) {
        const base = (data.full_name || "user").toLowerCase().replace(/\s+/g, "").slice(0, 5)
        const generatedCode = `${base}${Math.floor(1000 + Math.random() * 9000)}`
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ referral_code: generatedCode })
          .eq("id", session.user.id)

        if (!updateError) {
          setReferralCode(generatedCode)
          setReferralLink(`${window.location.origin}/register?ref=${generatedCode}`)
        }
      } else {
        setReferralCode(data.referral_code)
        setReferralLink(`${window.location.origin}/register?ref=${data.referral_code}`)
      }
    }

    fetchReferralCode()

    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  if (loading || (!session && !redirectTimeoutRef.current)) {
    return <div className="p-6 text-center">Loading...</div>
  }

  if (!session) {
    return <div className="p-6 text-center">Redirecting…</div>
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Earn More</span>
        </Link>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Refer & Earn Section */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">Refer &amp; Earn</h2>
              <p className="text-purple-100 text-sm">
                Earn ₦5,000 for each friend who joins
              </p>
            </div>
          </div>

          <p className="text-sm mb-4">
            Hi {displayName}, invite friends to PayGo and earn ₦5,000 for each friend who signs up
            using your referral link and purchases a PAY ID.
          </p>

          {referralCode && (
            <div className="bg-white rounded-lg p-4 text-purple-700">
              <p className="font-semibold mb-1">Your Referral Code:</p>
              <div className="text-lg font-mono bg-gray-100 p-2 rounded mb-3">
                {referralCode}
              </div>
              <p className="text-sm mb-1">Your Referral Link:</p>
              <div className="bg-gray-100 p-2 rounded text-sm break-all mb-2">
                {referralLink}
              </div>
              <Button
                onClick={() => navigator.clipboard.writeText(referralLink)}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white"
              >
                Copy Referral Link
              </Button>
            </div>
          )}

          <Link href="/refer">
            <Button className="w-full mt-4 bg-white text-purple-700 hover:bg-gray-100 flex items-center justify-center gap-2 h-12">
              <Share2 className="h-5 w-5" />
              Start Referring Friends
            </Button>
          </Link>
        </div>

        {/* EasyMonie REF Section */}
        <div className="text-center space-y-4 pt-4 border-t">
          <h2 className="text-2xl font-bold text-purple-800">EasyMonie REF</h2>

          <div className="space-y-2 text-gray-600">
            <p>Take your earnings to the next level with EasyMonie bot.</p>
            <p>Access exclusive features and higher earning opportunities.</p>
            <p>Join thousands of users already maximizing their income.</p>
          </div>

          <a
            href="https://t.me/Easymoniee_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
          >
            Claim ₦1,000,000
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
