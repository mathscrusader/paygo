"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, CheckCircle, Mail } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  created_at: string
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchNotifications = async () => {
    setLoading(true)
    const res = await fetch("/api/notifications")
    if (res.ok) {
      const data = await res.json()
      setNotifications(data)
    } else {
      toast({
        title: "Error",
        description: "Failed to fetch notifications.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (notificationId: string) => {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    })

    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      toast({
        title: "Success",
        description: "Notification marked as read.",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      })
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen pb-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-black">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-lg">Notifications</span>
        </Link>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Your Messages</h2>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                {unreadCount} new
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mt-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`overflow-hidden transition-all ${
                  !notification.read
                    ? "border-l-4 border-l-purple-500 bg-white"
                    : "bg-gray-100"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          !notification.read
                            ? "bg-purple-100 text-purple-600"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        <Mail className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg text-gray-800">{notification.title}</CardTitle>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs font-medium text-purple-600 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  <CardDescription className="text-gray-500 text-xs pt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{notification.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
            <p className="mt-1 text-sm text-gray-500">You have no new messages from the admin.</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
           <div className="flex justify-center mt-8">
             <div className="bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
               <CheckCircle className="h-4 w-4 text-green-500" />
               You're all caught up!
             </div>
           </div>
        )}
      </div>
    </div>
  )
}