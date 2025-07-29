"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationManager } from "@/components/notification-manager"
import { PromoCarousel } from "@/components/promo-carousel"
import { WelcomePopup } from "@/components/welcome-popup"
import { NewMonthPopup } from "@/components/new-month-popup"
import { FastPaymentPopup } from "@/components/fast-payment-popup"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"

interface UserData {
  name: string
  email: string
  balance: number
  weeklyRewards: number
  hasPayId: boolean
  profilePicture?: string
}

interface MenuItem {
  name: string
  icon?: React.ElementType
  emoji?: string
  link?: string
  external?: boolean
  action?: () => void
  color: string
  bgColor: string
}

const WELCOME_BONUS = 180_000

export default function DashboardPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [userData, setUserData] = useState<UserData | null>(null)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showNewMonthPopup, setShowNewMonthPopup] = useState(false)
  const [showFastPaymentPopup, setShowFastPaymentPopup] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [currentLevel, setCurrentLevel] = useState<{ id: string; name: string } | null>(null)
  const [unseenCount, setUnseenCount] = useState<number>(0)

  useEffect(() => {
    if (loading) return
    if (!session) {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = setTimeout(() => {
        if (!session) router.replace("/login")
      }, 400)
    }
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  useEffect(() => {
    if (loading || !session) return

    ;(async () => {
      const baseName =
        session.user.user_metadata?.fullName ||
        session.user.email?.split("@")[0] ||
        "User"
      const baseEmail = session.user.email || ""
      const profilePicture =
        session.user.user_metadata?.avatar_url || undefined

      let balance = 0
      let weeklyRewards = 0

      const { data: walletRow } = await supabase
        .from("wallet")
        .select("balance")
        .eq("userid", session.user.id)
        .maybeSingle()

      if (!walletRow) {
        const { error: upsertErr } = await supabase
          .from("wallet")
          .upsert(
            { userid: session.user.id, balance: WELCOME_BONUS },
            { onConflict: "userid" }
          )
        if (!upsertErr) balance = WELCOME_BONUS
      } else {
        balance = Number(walletRow.balance) || 0
      }

      const { data: rewardsData } = await supabase
        .from("ReferralRewards")
        .select("reward_amount")
        .eq("referrer_id", session.user.id)
        .eq("status", "pending")

      if (rewardsData?.length) {
        weeklyRewards = rewardsData.reduce(
          (sum, r) => sum + (r.reward_amount || 0),
          0
        )
      }

      const { data: payRow } = await supabase
        .from("payid")
        .select("payid")
        .eq("userid", session.user.id)
        .maybeSingle()
      const hasPayId = Boolean(payRow?.payid)

      setUserData({
        name: baseName,
        email: baseEmail,
        balance,
        weeklyRewards,
        hasPayId,
        profilePicture,
      })

      const { data: profileData } = await supabase
        .from("profiles")
        .select("upgrade_level_id")
        .eq("id", session.user.id)
        .maybeSingle()
      if (profileData?.upgrade_level_id) {
        const { data: levelData } = await supabase
          .from("UpgradeLevel")
          .select("id, name")
          .eq("id", profileData.upgrade_level_id)
          .maybeSingle()
        if (levelData) setCurrentLevel(levelData)
      }

      const { data: unseen } = await supabase
        .from("Transaction")
        .select("id")
        .eq("userId", session.user.id)
        .eq("viewed", false)

      setUnseenCount(unseen?.length || 0)

      // Pop-up logic
      const welcomeKey = "paygo-welcome-popup-shown"
      if (!localStorage.getItem(welcomeKey)) {
        setShowWelcomePopup(true)
      } else {
        const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`
        if (localStorage.getItem("paygo-new-month-popup-last-shown") !== monthKey) {
          setTimeout(() => setShowNewMonthPopup(true), 2000)
        } else if (
          localStorage.getItem("paygo-fast-payment-popup-last-shown") !==
          new Date().toDateString()
        ) {
          setTimeout(() => setShowFastPaymentPopup(true), 3000)
        }
      }
    })()
  }, [loading, session])

  const handleCloseWelcomePopup = useCallback(() => {
    setShowWelcomePopup(false)
    localStorage.setItem("paygo-welcome-popup-shown", "true")
    setTimeout(() => setShowNewMonthPopup(true), 1000)
  }, [])

  const handleCloseNewMonthPopup = useCallback(() => {
    setShowNewMonthPopup(false)
    localStorage.setItem(
      "paygo-new-month-popup-last-shown",
      `${new Date().getFullYear()}-${new Date().getMonth()}`
    )
    setTimeout(() => setShowFastPaymentPopup(true), 1000)
  }, [])

  const handleCloseFastPaymentPopup = useCallback(() => {
    setShowFastPaymentPopup(false)
    localStorage.setItem(
      "paygo-fast-payment-popup-last-shown",
      new Date().toDateString()
    )
  }, [])

  if (loading || (session && !userData)) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!session) {
    return <div className="p-6 text-center">Redirecting...</div>
  }

  const formatCurrency = (amount: number) => {
    if (!showBalance) return "••••••••"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("NGN", "₦")
  }

  const menuItems: MenuItem[] = [
    { name: "Buy PAY ID", icon: CreditCard, link: "/buy-pay-id", color: "text-purple-600", bgColor: "" },
    { name: "Video", emoji: "📺", link: "/watch", color: "text-red-600", bgColor: "" },
    { name: "Airtime", emoji: "📶", link: "/airtime", color: "text-green-600", bgColor: "" },
    { name: "Data", emoji: "🛢️", link: "/data", color: "text-cyan-600", bgColor: "" },
    { name: "Chat us", emoji: "🎧", link: "/support", color: "text-teal-600", bgColor: "" },
    { name: "Join Group", emoji: "🌐", link: "/groups", color: "text-pink-600", bgColor: "" },
    { name: "Earn More", emoji: "💰", link: "/earn-more", color: "text-yellow-600", bgColor: "" },
    { name: "Profile", emoji: "👤", link: "/profile", color: "text-violet-600", bgColor: "" },
  ]

  return (
    <div className="min-h-screen pb-4 bg-gradient-to-b from-[#f9f2f2] to-[#f5f0ff]">
      <NotificationManager />

      {showWelcomePopup && userData && (
        <WelcomePopup userName={userData.name.split(" ")[0]} onClose={handleCloseWelcomePopup} />
      )}
      {showNewMonthPopup && <NewMonthPopup onClose={handleCloseNewMonthPopup} />}
      {showFastPaymentPopup && <FastPaymentPopup onClose={handleCloseFastPaymentPopup} />}

      <div className="bg-white text-green-600 text-xs py-3 px-4 shadow-sm w-full">
        <div className="overflow-hidden whitespace-nowrap">
          <div className="animate-marquee inline-block font-bold">
            🚀 Great News! Payment processing is now lightning fast! Make your payments and get verified instantly!
          </div>
        </div>
      </div>

      <div className="bg-purple-700 text-white rounded-xl p-5 shadow-lg mx-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
              {userData?.profilePicture ? (
                <img src={userData.profilePicture} alt={userData.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold text-xl text-purple-700">{userData?.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="font-medium text-lg">Hi, {userData.name.split(" ")[0]} 👋</div>
              <div className="text-sm text-gray-200">Welcome back!</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell only */}
            <Link href="/transactions">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-500">
                <span className="text-lg">🔔</span>
                {unseenCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {unseenCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium text-gray-200 mb-1">Your Balance</div>
          <div className="flex justify-between items-center">
            <div className="text-3xl font-bold">{formatCurrency(userData.balance)}</div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-gray-200 hover:text-white"
              aria-label="Toggle balance"
            >
              {showBalance ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="2" y1="21" x2="22" y2="3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <Link href="/rewards" title="View details">
            <div className="text-sm text-purple-200 mt-1 flex items-center gap-1 hover:text-white cursor-pointer transition-all group">
              <span className="font-medium">Weekly Rewards:</span>{" "}
              <span>{showBalance ? formatCurrency(userData.weeklyRewards) : "••••••••"}</span>
              <ChevronRight className="w-4 h-4 mt-0.5 opacity-70" />
            </div>
          </Link>

          <div className="text-sm text-purple-200 mt-1">
            <span className="font-medium">Current Level:</span>{" "}
            {currentLevel ? (
              <span className="font-semibold">{currentLevel.name}</span>
            ) : (
              <span className="text-gray-300">None</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Link href="/upgrade" className="flex-1 mr-2">
            <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-full py-3 h-auto flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="#6b21a8" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                  <path d="M16 6h4v4" />
                </svg>
              </div>
              <span>Upgrade</span>
            </Button>
          </Link>
          <Link href="/withdraw" className="flex-1 ml-2">
            <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-full py-3 h-auto flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="#6b21a8" strokeWidth="2">
                  <path d="M12 19V5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </div>
              <span>Transfer</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 p-2 mt-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <Link key={index} href={item.link || "#"}>
              <div className="flex flex-col items-center justify-center p-1 hover:-translate-y-1 transition-transform duration-300">
                <div className={`w-10 h-10 flex items-center justify-center mb-1 ${item.color} animate-pulse-slow rounded-lg`}>
                  {item.emoji ? (
                    <span className="text-2xl">{item.emoji}</span>
                  ) : (
                    Icon && <Icon size={22} strokeWidth={1.5} />
                  )}
                </div>
                <span className="text-xs font-medium text-center text-gray-700">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mx-4 mt-4 mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Current Promotions</h2>
        <PromoCarousel />
      </div>
    </div>
  )
}