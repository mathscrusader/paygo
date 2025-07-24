"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  LogOut,
  User,
  Bell,
  BellOff,
  Info,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { LogoutConfirmation } from "@/components/logout-confirmation"
import {
  requestNotificationPermission,
  showLocalNotification
} from "@/services/notification-service"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"

interface ProfileData {
  name: string
  email: string
  balance: number
  weeklyRewards: number
  hasPayId: boolean
  profilePicture?: string
  level?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** Graceful auth guard */
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
    }
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  /** Load profile data (from Supabase + localStorage fallback for balance etc.) */
  useEffect(() => {
    if (!session) return

    // Local balance / rewards fallback (if still using local simulation)
    const localUserRaw = localStorage.getItem("paygo-user")
    let localBalance = 0
    let localWeeklyRewards = 0
    let localPicture: string | undefined
    if (localUserRaw) {
      try {
        const parsed = JSON.parse(localUserRaw)
        localBalance = parsed.balance ?? 0
        localWeeklyRewards = parsed.weeklyRewards ?? 0
        localPicture = parsed.profilePicture
      } catch {
        /* ignore */
      }
    }

    const baseName =
      session.user.user_metadata?.fullName ||
      session.user.user_metadata?.name ||
      session.user.email?.split("@")[0] ||
      "User"

    setProfile({
      name: baseName,
      email: session.user.email || "",
      balance: localBalance,
      weeklyRewards: localWeeklyRewards,
      hasPayId: false,
      profilePicture:
        localPicture ||
        session.user.user_metadata?.avatar_url ||
        undefined,
      level: "Basic"
    })

    // (Optional) future: fetch upgrade level / pay id etc. here
  }, [session])

  /** Notification permission state */
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  /** Handlers */
  const handleLogoutClick = () => setShowLogoutConfirmation(true)
  const handleLogoutCancel = () => setShowLogoutConfirmation(false)

  const handleLogoutConfirm = async () => {
    // Supabase sign out
    await supabase.auth.signOut()
    // Remove any local simulated user
    localStorage.removeItem("paygo-user")
    router.replace("/login")
  }

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => {
        setPreviewImage(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfilePicture = () => {
    if (previewImage && profile) {
      const updated = { ...profile, profilePicture: previewImage }
      setProfile(updated)
      // Persist back to local fallback (until fully moved server-side)
      const raw = localStorage.getItem("paygo-user")
      let merged = {}
      try {
        merged = raw ? JSON.parse(raw) : {}
      } catch {
        /* ignore */
      }
      localStorage.setItem(
        "paygo-user",
        JSON.stringify({ ...merged, profilePicture: previewImage })
      )
      setPreviewImage(null)
    }
  }

  const handleCancelProfilePicture = () => setPreviewImage(null)

  const handleToggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      const permission = await requestNotificationPermission()
      if (permission === "granted") {
        setNotificationsEnabled(true)
        localStorage.setItem("paygo-notification-permission", "granted")
        showLocalNotification("Notifications Enabled", {
          body:
            "You will now receive updates about new features and important information."
        })
      }
    } else {
      alert(
        "To disable notifications, please change the permission in your browser settings."
      )
    }
  }, [notificationsEnabled])

  /** Loading states */
  if (loading || (session && !profile)) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!session) {
    return <div className="p-6 text-center">Redirecting…</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f2f2] to-[#f5f0ff] pb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="font-bold text-lg">Profile</div>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-6 px-4">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer mb-2 border-2 border-purple-500"
            onClick={handleProfilePictureClick}
          >
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture || "/placeholder.svg"}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                <User className="h-12 w-12 text-purple-500" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-1.5">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-sm text-gray-500">Tap to change profile picture</p>
        </div>

        {/* Preview + Save */}
        {previewImage && (
          <div className="mb-8 bg-white p-4 rounded-xl shadow">
            <h3 className="font-medium mb-3">Preview</h3>
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500">
                <img
                  src={previewImage || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleCancelProfilePicture}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfilePicture}
                className="bg-purple-600 hover:bg-purple-700 rounded-full"
              >
                Save Picture
              </Button>
            </div>
          </div>
        )}

        {/* Menu Options */}
        <div className="space-y-4">
          <Link href="/profile/information">
            <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Profile Information</p>
                  <p className="text-sm text-gray-500">
                    View and edit your profile details
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
          </Link>

          <Link href="/support">
            <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium">Help & Support</p>
                  <p className="text-sm text-gray-500">
                    Get help with using PayGo
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
          </Link>

          <Link href="/about">
            <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">About</p>
                  <p className="text-sm text-gray-500">Learn more about PayGo</p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
          </Link>

          <Link href="/refer">
            <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="font-medium">Refer & Earn</p>
                  <p className="text-sm text-gray-500">
                    Invite friends and earn ₦5,000 per referral
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
          </Link>

          {"Notification" in window && (
            <div className="bg-white rounded-xl shadow p-5 mb-6">
              <h2 className="text-lg font-semibold mb-4">
                Notification Settings
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {notificationsEnabled ? (
                    <Bell className="h-5 w-5 text-purple-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">
                      {notificationsEnabled
                        ? "You'll receive notifications about new features and updates"
                        : "Enable to receive important updates"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                />
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2 mt-6"
            onClick={handleLogoutClick}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {showLogoutConfirmation && (
        <LogoutConfirmation
          onConfirm={handleLogoutConfirm}
            onCancel={handleLogoutCancel}
        />
      )}
    </div>
  )
}
