"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ActivatePayIdPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const payId = searchParams.get("payId")

  const [accountNumber, setAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [payIdInput, setPayIdInput] = useState(payId || "")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!payId) {
      router.push("/dashboard")
    }
  }, [payId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accountNumber || !bankName || !accountName || !payIdInput) {
      alert("Please fill in all fields")
      return
    }

    setIsLoading(true)

    // Store activation data
    localStorage.setItem(
      "paygo-activation-data",
      JSON.stringify({
        payId: payIdInput,
        accountNumber,
        bankName,
        accountName,
      }),
    )

    // Simulate loading for 6 seconds
    setTimeout(() => {
      setIsLoading(false)
      router.push("/activate-pay-id/payment")
    }, 6000)
  }

  if (!payId) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-[#2e1065] text-white p-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">Activate PAY ID</h1>
      </div>

      {/* Form */}
      <div className="p-4 flex-1">
        <div className="mb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-purple-800 mb-2">PAY ID Activation</h3>
            <p className="text-purple-700 text-sm">
              Activate your PAY ID: <span className="font-bold">{payId}</span>
            </p>
            <p className="text-purple-600 text-sm mt-1">Activation Fee: ₦15,700</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="payId" className="text-gray-700 font-medium">
              PAY ID
            </label>
            <Input
              id="payId"
              value={payIdInput}
              onChange={(e) => setPayIdInput(e.target.value)}
              required
              className="h-12"
              placeholder="Enter your PAY ID"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="accountNumber" className="text-gray-700 font-medium">
              Account Number
            </label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              className="h-12"
              placeholder="Enter your account number"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bankName" className="text-gray-700 font-medium">
              Bank Name
            </label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
              className="h-12"
              placeholder="Enter your bank name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="accountName" className="text-gray-700 font-medium">
              Account Name
            </label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              className="h-12"
              placeholder="Enter your account name"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#9333EA] hover:bg-purple-700 text-white h-14 mt-6"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Activate PAY ID"
            )}
          </Button>

          <p className="text-center text-gray-500 mt-4 text-sm">
            By activating your PAY ID, you agree to pay the activation fee of ₦15,700.
          </p>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 text-center">
        <p className="text-gray-700 font-medium">PayGo Financial Services LTD</p>
      </div>
    </div>
  )
}
