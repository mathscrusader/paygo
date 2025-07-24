"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageSquare, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LiveChat } from "@/components/live-chat"
import { useAuth } from "@/app/providers"

export default function SupportPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [showLiveChat, setShowLiveChat] = useState(false)
  const [displayName, setDisplayName] = useState<string>("User")
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Graceful auth guard
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
      // derive display name from metadata/email
      const metaName =
        (session.user.user_metadata && (session.user.user_metadata.fullName || session.user.user_metadata.name)) ||
        session.user.email?.split("@")[0] ||
        "User"
      setDisplayName(metaName)
    }
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  const handleWhatsAppSupport = () => {
    const phoneNumber = "2349113585676"
    const message = encodeURIComponent("hello i contacted for help from Paygo app")
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const handleLiveChat = () => setShowLiveChat(true)
  const handleCloseLiveChat = () => setShowLiveChat(false)

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

        {/* Live Chat Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              Live Chat
            </CardTitle>
            <CardDescription>Chat with our support team directly in the app</CardDescription>
          </CardHeader>
            <CardContent>
            <Button
              onClick={handleLiveChat}
              className="w-full bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Start Live Chat
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Our support agents are available to assist you with any questions or issues.
            </p>
          </CardContent>
        </Card>

        {/* WhatsApp Support Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              WhatsApp Support
            </CardTitle>
            <CardDescription>Chat with our support team on WhatsApp for quick assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleWhatsAppSupport}
              className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <MessageSquare className="h-5 w-5" />
              Chat on WhatsApp
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Our support team is available 24/7 to assist you with any issues or questions.
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 mt-6">
          Financial Services
          <br />
          PayGo © 2023. All rights reserved.
        </div>
      </div>

      {showLiveChat && <LiveChat onClose={handleCloseLiveChat} />}
    </div>
  )
}
