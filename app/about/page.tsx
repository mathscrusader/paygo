"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"
import { useAuth } from "@/app/providers"

export default function AboutPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [displayName, setDisplayName] = useState("User")

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
      const name =
        session.user.user_metadata?.fullName ||
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0] ||
        "User"
      setDisplayName(name)
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
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">About</span>
        </Link>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-center mb-6">
          <Logo className="w-64 hover:scale-110 transition-transform duration-300" />
        </div>

        <h2 className="text-2xl font-bold text-center text-purple-800">
          About PayGo
        </h2>

        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            PayGo is a leading financial services platform that provides users
            with convenient access to digital transactions, airtime and data
            purchases, and fund withdrawals.
          </p>

          <p>
            Our mission is to make financial services accessible to everyone,
            with a user-friendly interface and reliable service. We continually
            improve features so users like <span className="font-semibold">{displayName}</span> enjoy
            speed, transparency, and rewards.
          </p>

          <p>With PayGo, you can:</p>

            <ul className="list-disc pl-6 space-y-2">
            <li>Purchase airtime and data for all major networks</li>
            <li>Transfer funds to any bank account</li>
            <li>Track your transaction history</li>
            <li>Earn rewards and cashback on transactions</li>
            <li>Get 24/7 customer support</li>
          </ul>

          <p>
            PayGo was founded in 2023 and has quickly grown into a trusted
            platform for digital financial services across multiple regions.
          </p>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
          <p className="text-gray-700">
            Phone: +234 911 358 5676
            <br />
            Address: 33 Financial Street, Lagos, Nigeria
          </p>
        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
          PayGo © 2023. All rights reserved.
        </div>
      </div>
    </div>
  )
}
