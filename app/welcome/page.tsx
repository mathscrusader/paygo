"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f2f2]">
      <div className="w-full max-w-md flex flex-col items-center gap-8 text-center">
        <div className="animate-fade-in">
          <Logo className="w-64 mb-8" />
        </div>

        <h1 className="text-3xl font-bold text-[#2e1065] animate-fade-in" style={{ animationDelay: "0.3s" }}>
          Welcome to PayGo!
        </h1>

        <p className="text-lg text-gray-600 leading-relaxed animate-fade-in" style={{ animationDelay: "0.6s" }}>
          As a new user, you&apos;ll receive a generous welcome bonus of ₦180,000, which can be withdrawn at any time.
          Yes, you read that right - it&apos;s yours to keep!
        </p>
      </div>
    </div>
  )
}
