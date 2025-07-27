"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const code = searchParams.get("code")

  // Handle Supabase session exchange using the code
  useEffect(() => {
    if (!code) {
      router.replace("/login")
      return
    }

    // Exchange the code for a session
    supabase.auth
      .exchangeCodeForSession(code)
      .catch(() => router.replace("/login"))
  }, [code, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setMessage("Password updated! You can now log in with your new password.")
    setLoading(false)
    setTimeout(() => router.replace("/login"), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f2f2]">
      <Logo className="w-64 mb-4" />
      <h1 className="text-2xl font-semibold mb-6">Reset Your Password</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert variant="default" className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4"
        autoComplete="off"
      >
        <Input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="h-14 rounded-full"
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="h-14 rounded-full"
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-full bg-black text-white"
        >
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  )
}
