"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

export default function WhatsappInputPage() {
  const router = useRouter()
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Basic validation for now, will add country code later
    if (!whatsappNumber) {
      setError("Please enter your WhatsApp number.")
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("User not logged in. Please log in again.")
        router.push("/login")
        return
      }

      // Update the user's profile with the WhatsApp number
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ whatsapp_number: whatsappNumber })
        .eq('id', user.id)

      if (updateError) {
        setError(`Failed to save WhatsApp number: ${updateError.message}`)
        setLoading(false)
        return
      }

      // Redirect to dashboard after successful submission
      router.push("/dashboard")

    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f2f2]">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <h1 className="text-2xl font-semibold text-center">Enter your WhatsApp Number</h1>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="whatsapp">WhatsApp Number (with country code)</Label>
            <Input
              type="tel"
              id="whatsapp"
              placeholder="+1234567890"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
              className="h-14 rounded-full"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-full bg-black text-white"
          >
            {loading ? "Saving..." : "Submit WhatsApp Number"}
          </Button>
        </form>
      </div>
    </div>
  )
}