// app/profile/information/page.tsx  (adjust path if different)
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  Mail,
  Award,
  CheckCircle,
  LogOut,
  Copy as CopyIcon,
  Check as CheckIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutConfirmation } from "@/components/logout-confirmation"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"

interface LocalUserData {
  name: string
  email: string
  balance: number
  weeklyRewards: number
  profilePicture?: string
  level?: string
  country?: string
  payId?: string | null
}

export default function ProfileInformationPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  const [userData, setUserData] = useState<LocalUserData | null>(null)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [copiedPayId, setCopiedPayId] = useState(false)

  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasStabilizedRef = useRef(false)

  // Auth guard
  useEffect(() => {
    if (loading) return
    if (hasStabilizedRef.current) return

    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    redirectTimeoutRef.current = setTimeout(() => {
      if (!session) {
        hasStabilizedRef.current = true
        router.replace("/login")
      } else {
        hasStabilizedRef.current = true
      }
    }, 400)

    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  // Load profile + Pay ID
  useEffect(() => {
    if (!session || userData) return

    ;(async () => {
      const localRaw = localStorage.getItem("paygo-user")
      let localObj: any = {}
      if (localRaw) {
        try {
          localObj = JSON.parse(localRaw)
        } catch {}
      }

      const name =
        localObj.name ||
        session.user.user_metadata?.fullName ||
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0] ||
        "User"

      // Direct PayId lookup
      const { data: payRow } = await supabase
        .from("payid")
        .select("payid")
        .eq("userid", session.user.id)
        .maybeSingle()

      const payId = payRow?.payid ?? null

      setUserData({
        name,
        email: session.user.email || localObj.email || "",
        balance: localObj.balance ?? 0,
        weeklyRewards: localObj.weeklyRewards ?? 0,
        profilePicture:
          localObj.profilePicture ||
          session.user.user_metadata?.avatar_url ||
          undefined,
        level: localObj.level || "Basic",
        country:
          localObj.country || session.user.user_metadata?.countryCode || undefined,
        payId,
      })
    })()
  }, [session, userData])

  const handleLogoutConfirm = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("paygo-user")
    router.replace("/login")
  }

  const handleCopyPayId = async () => {
    if (!userData?.payId) return
    try {
      await navigator.clipboard.writeText(userData.payId)
      setCopiedPayId(true)
      setTimeout(() => setCopiedPayId(false), 2000)
    } catch {
      // ignore
    }
  }

  if (loading || (session && !userData && !hasStabilizedRef.current)) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!session && hasStabilizedRef.current) {
    return <div className="p-6 text-center">Redirecting…</div>
  }
  if (!session) return <div className="p-6 text-center">Loading...</div>
  if (!userData) return <div className="p-6 text-center">Preparing profile…</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f2f2] to-[#f5f0ff] pb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="font-bold text-lg">Profile Information</div>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-6 px-4">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500 mb-2">
            {userData.profilePicture ? (
              <img
                src={userData.profilePicture || "/placeholder.svg"}
                alt={userData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                <User className="h-12 w-12 text-purple-500" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{userData.name}</h2>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Account Information</h3>

          <div className="space-y-4">
            <InfoRow
              iconBg="bg-purple-100"
              icon={<User className="h-5 w-5 text-purple-600" />}
              label="Full Name"
              value={userData.name}
            />
            <InfoRow
              iconBg="bg-blue-100"
              icon={<Mail className="h-5 w-5 text-blue-600" />}
              label="Email Address"
              value={userData.email}
            />
            <InfoRow
              iconBg="bg-green-100"
              icon={<span className="text-lg">🌍</span>}
              label="Country"
              value={userData.country || "Not specified"}
            />
            <InfoRow
              iconBg="bg-amber-100"
              icon={<Award className="h-5 w-5 text-amber-600" />}
              label="Account Level"
              value={userData.level || "Basic"}
            />
            <InfoRow
              iconBg="bg-green-100"
              icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              label="Account Status"
              value={
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
                  Active
                </div>
              }
            />
            {/* PAY ID */}
            <InfoRow
              iconBg="bg-purple-100"
              icon={<div className="text-purple-600 font-bold text-sm">ID</div>}
              label="PAY ID"
              value={
                userData.payId ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-700">{userData.payId}</span>
                    <button
                      onClick={handleCopyPayId}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                    >
                      {copiedPayId ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-orange-500 font-medium">Not Purchased</span>
                )
              }
            />
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2 mt-6"
          onClick={() => setShowLogoutConfirmation(true)}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {showLogoutConfirmation && (
        <LogoutConfirmation
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutConfirmation(false)}
        />
      )}
    </div>
  )
}

function InfoRow({
  iconBg,
  icon,
  label,
  value,
}: {
  iconBg: string
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center mt-1`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}
