// app/components/admin-chat.tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: "user" | "admin"
  content: string
  created_at: string
}

export function AdminChat({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // load history
    ;(async () => {
      const { data: msgs, error } = await supabase
        .from<Message>("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
      if (!error && msgs) setMessages(msgs)
    })()

    // realtime subscription
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        sender_id: "admin", // or pull from your admin session
        sender_role: "admin",
        content: input.trim(),
      },
    ])
    setInput("")
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8f9ff]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-xs px-4 py-2 rounded-lg break-words ${
              m.sender_role === "admin"
                ? "bg-gray-200 text-gray-800 self-start rounded-bl-none"
                : "bg-blue-600 text-white self-end rounded-br-none"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>
      <div className="p-3 bg-white border-t flex items-center">
        <input
          className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey
              ? (e.preventDefault(), sendMessage())
              : null
          }
          placeholder="Type a reply..."
        />
        <Button onClick={sendMessage} variant="ghost" className="p-2">
          <Send />
        </Button>
      </div>
    </div>
  )
}
