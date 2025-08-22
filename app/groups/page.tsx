"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Send, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"

export default function GroupsPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [displayName, setDisplayName] = useState("User")
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    } else {
      const metaName =
        (session.user.user_metadata &&
          (session.user.user_metadata.fullName ||
            session.user.user_metadata.name)) ||
        session.user.email?.split("@")[0] ||
        "User"
      setDisplayName(metaName)
    }
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  const handleJoinTelegram = () => {
    window.open("https://t.me/Reward_community", "_blank")
  }

  if (loading || (!session && !redirectTimeoutRef.current)) {
    return <div className="p-6 text-center">Loading...</div>
  }

  if (!session) {
    return <div className="p-6 text-center">Redirecting…</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Join Our Community</span>
        </Link>
      </div>

      <div className="p-4 space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-purple-800 mb-2">
            Connect With Us, {displayName}
          </h2>
          <p className="text-gray-600 text-sm">
            Join our official Telegram channel for updates and support
          </p>
        </div>

        {/* Telegram Channel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Send className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Telegram Channel</h3>
            </div>
          </div>
          <Button
            onClick={handleJoinTelegram}
            className="w-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2 rounded-full"
          >
            <Send className="h-5 w-5" />
            Join Telegram
          </Button>
        </div>
      </div>
    </div>
  )
}
