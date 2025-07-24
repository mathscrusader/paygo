"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UpgradeSuccessPage() {
  const router = useRouter()
  const [upgradeData, setUpgradeData] = useState<any>(null)

  useEffect(() => {
    // Check if upgrade data exists
    const storedUpgradeData = localStorage.getItem("paygo-upgrade-data")

    if (!storedUpgradeData) {
      router.push("/upgrade")
      return
    }

    const parsedUpgradeData = JSON.parse(storedUpgradeData)
    setUpgradeData(parsedUpgradeData)

    // Update user level
    const storedUser = localStorage.getItem("paygo-user")
    if (storedUser) {
      const user = JSON.parse(storedUser)
      user.level = parsedUpgradeData.name
      localStorage.setItem("paygo-user", JSON.stringify(user))
    }
  }, [router])

  const handleBackToDashboard = () => {
    // Clear the upgrade data
    localStorage.removeItem("paygo-upgrade-data")
    router.push("/dashboard")
  }

  if (!upgradeData) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4">
        <h1 className="text-xl font-bold">Upgrade Result</h1>
      </div>

      {/* Success Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Upgrade Successful!</h2>
        <p className="text-gray-500 text-center mb-8">
          Your account has been successfully upgraded to {upgradeData.name}.
        </p>

        <div className="w-full max-w-md bg-gray-50 rounded-lg p-4 mb-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">New Level:</span>
              <span className="font-semibold">{upgradeData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-semibold">₦{upgradeData.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID:</span>
              <span className="font-semibold">{`UPG${Date.now().toString().slice(-8)}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-semibold text-green-600">Active</span>
            </div>
          </div>
        </div>

        <Button onClick={handleBackToDashboard} className="w-full max-w-md bg-purple-600 hover:bg-purple-700">
          Back to Dashboard
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 text-center">
        <p className="text-gray-700 font-medium">PayGo Financial Services LTD</p>
      </div>
    </div>
  )
}
