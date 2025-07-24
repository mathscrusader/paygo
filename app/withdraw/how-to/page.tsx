"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/app/providers"

export default function HowToWithdrawPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
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
        if (!session) {
          router.replace("/login")
        }
      }, 400)
    }

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
      <div className="flex items-center p-4 bg-purple-600 text-white">
        <Link href="/withdraw" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-xl">How to Withdraw</span>
        </Link>
      </div>

      {/* Video Content */}
      <div className="p-4">
        <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
          <iframe
            src="https://www.youtube.com/embed/Lz1QO8pDvaY"
            title="How to Withdraw - PayGo Tutorial"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-lg"
          ></iframe>
        </div>
      </div>
    </div>
  )
}
