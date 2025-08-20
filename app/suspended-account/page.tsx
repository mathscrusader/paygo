"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/app/providers"

export default function SuspendedAccountPage() {
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
      <div className="flex items-center justify-center p-4 border-b bg-red-50">
        <span className="font-medium text-xl text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Account Suspended
        </span>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto mt-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Hello, {displayName}</h2>
          <p className="text-gray-600">
            Your account has been suspended. Please contact our support team for assistance.
          </p>
        </div>

        {/* Support Card */}
        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-red-600" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Click below to chat with our support team on Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSupport}
              className="w-full bg-red-500 hover:bg-red-600 flex items-center gap-2"
            >
              <MessageSquare className="h-5 w-5" />
              Contact Support
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Our support team will help resolve your account suspension.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}