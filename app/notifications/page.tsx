"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, CheckCircle, Calendar, Zap, Users, Gift } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Feature {
  id: number
  title: string
  description: string
  date: string
  icon: React.ElementType
  color: string
  isNew: boolean
}

export default function NotificationsPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)

  // Sample features data - in a real app, this would come from an API
  const features: Feature[] = [
    {
      id: 1,
      title: "Weekly Rewards Boost",
      description: "We've increased weekly rewards for all users. Check your dashboard to see your new rewards!",
      date: "May 7, 2024",
      icon: Gift,
      color: "text-purple-600 bg-purple-100",
      isNew: true,
    },
    {
      id: 2,
      title: "Improved Profile Management",
      description: "You can now update your profile picture and manage your account details more easily.",
      date: "May 5, 2024",
      icon: Users,
      color: "text-blue-600 bg-blue-100",
      isNew: true,
    },
    {
      id: 3,
      title: "Enhanced Dashboard",
      description: "We've redesigned the dashboard for better navigation and a more intuitive experience.",
      date: "April 30, 2024",
      icon: Zap,
      color: "text-amber-600 bg-amber-100",
      isNew: false,
    },
    {
      id: 4,
      title: "Scheduled Withdrawals",
      description: "You can now schedule withdrawals in advance for more convenient financial planning.",
      date: "April 25, 2024",
      icon: Calendar,
      color: "text-green-600 bg-green-100",
      isNew: false,
    },
  ]

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("paygo-user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    setUserData(JSON.parse(storedUser))
  }, [router])

  if (!userData) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Notifications</span>
        </Link>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">New Features</h2>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">{features.filter((f) => f.isNew).length} new</span>
          </div>
        </div>

        <div className="space-y-4">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className={`overflow-hidden ${feature.isNew ? "border-l-4 border-l-purple-500" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${feature.color}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  {feature.isNew && (
                    <span className="bg-purple-100 text-purple-600 text-xs font-medium px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <CardDescription className="text-gray-500 text-xs">{feature.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <div className="bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            You're all caught up!
          </div>
        </div>
      </div>
    </div>
  )
}
