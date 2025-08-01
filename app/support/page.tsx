"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bot, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/app/providers"

export default function SupportPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [displayName, setDisplayName] = useState<string>("User")
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
          (session.user.user_metadata.fullName || session.user.user_metadata.name)) ||
        session.user.email?.split("@")[0] ||
        "User"
      setDisplayName(metaName)
    }

    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  const handleSupport = () => {
    window.open("https://t.me/rexnaija", "_blank")
  }

  const handleLiveChat = () => {
    window.open("https://t.me/rewardpal", "_blank")
  }

  const stillLoading = loading || (loading === false && !session)

  if (stillLoading) {
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
          <span className="font-medium">Support</span>
        </Link>
      </div>

      <div className="p-4 space-y-6">
        <h2 className="text-xl font-semibold">How can we help you, {displayName}?</h2>

        {/* Support Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Support
            </CardTitle>
            <CardDescription>
              Click here to chat with our support team on Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSupport}
              className="w-full bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
            >
              <Bot className="h-5 w-5" />
              Support
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Our support team is here to assist you.
            </p>
          </CardContent>
        </Card>

        {/* Live Chat Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Live Chat
            </CardTitle>
            <CardDescription>
              Join our Telegram live chat for real-time help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLiveChat}
              className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <MessageSquare className="h-5 w-5" />
              Live Chat
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Connect instantly with our team in live chat.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Financial Services
          <br />
          PayGo © 2023. All rights reserved.
        </div>
      </div>
    </div>
  )
}
