"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminRegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Insert into custom `users` table
    const userId = data.user?.id
    if (userId) {
      const { error: insertError } = await supabase
        .from("users")
        .insert([
          {
            id: userId,
            email,
            role: "admin",
            is_anonymous: false,
            is_sso_user: false,
            raw_user_meta_data: { fullName },
          },
        ])

      if (insertError) {
        setError("Admin created, but failed to insert into users table.")
        console.error("Insert error:", insertError)

        setLoading(false)
        return
      }
    }

    setLoading(false)
    router.push("/auth/signin")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f2f2]">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Registration</h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            className="w-full bg-purple-600 text-white"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Admin Account"}
          </Button>
        </form>
      </div>
    </div>
  )
}
