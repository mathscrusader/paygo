"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

interface Country {
  code: string
  name: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [country, setCountry] = useState("")
  const [countries, setCountries] = useState<Country[]>([])
  const [referralCode, setReferralCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Load country list from Supabase
  useEffect(() => {
    supabase
      .from<Country>("countries")
      .select("code,name")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading countries:", error)
        } else {
          setCountries(data || [])
        }
      })
  }, [])

  // Capture referral from URL or localStorage
  useEffect(() => {
    const url = new URL(window.location.href)
    const ref = url.searchParams.get("ref")
    if (ref) {
      localStorage.setItem("paygo-referral", ref)
      setReferralCode(ref)
    } else {
      const storedRef = localStorage.getItem("paygo-referral")
      if (storedRef) setReferralCode(storedRef)
    }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name || !email || !password || !country) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)

    // 1. Sign up user (sends confirmation email)
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { fullName: name, countryCode: country },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Insert into profiles table
    const userId = authData.user?.id
    if (userId) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: userId,
            full_name: name,
            country_code: country,
            referred_by: referralCode || null,
          },
        ])

      if (profileError) {
        console.error("Profile insert error:", profileError)
      } else if (referralCode) {
        // 3. Trigger referral bonus API
        try {
          await fetch("/api/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newUserId: userId,
              referralCode,
            }),
          })
        } catch (err) {
          console.error("Referral API error:", err)
        }
      }
    }

    setLoading(false)
    router.push(`/check-your-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f2f2]">
      <Logo className="w-64 mb-4" />
      <h1 className="text-2xl font-semibold mb-6">Register to continue</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleRegister} className="w-full max-w-md space-y-4" autoComplete="off">
        <Input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-14 rounded-full"
        />

        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-14 rounded-full"
        />

        <Select value={country} onValueChange={setCountry} required>
          <SelectTrigger className="h-14 rounded-full">
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent className="rounded-lg bg-white">
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-14 rounded-full"
        />

        <Input
          placeholder="Referral Code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="h-14 rounded-full"
        />

        <Button type="submit" disabled={loading} className="w-full h-14 rounded-full bg-black text-white">
          {loading ? "Registering…" : "Register"}
        </Button>
      </form>

      <p className="mt-4 text-center text-purple-600">
        Already have an account?{" "}
        <a href="/login" className="underline">
          Login
        </a>
      </p>
    </div>
  )
}
