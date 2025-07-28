// components/MessagesAndNotifications.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Chat } from "lucide-react"
import { NotificationManager } from "@/components/notification-manager"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"

export function MessagesAndNotifications() {
  const { session } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!session) return
    const convId = localStorage.getItem("convId")
    if (!convId) return

    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", convId)
      .eq("sender_role", "admin")
      .then(({ count }) => setCount(count ?? 0))
  }, [session])

  return (
    <div className="flex items-center space-x-4 px-4 pt-4">
      <Link href="/chat" className="relative group">
        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg hover:scale-110 transition-transform">
          <Chat className="text-xl text-white" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow">
              {count}
            </span>
          )}
        </div>
      </Link>
      <NotificationManager />
    </div>
  )
}
