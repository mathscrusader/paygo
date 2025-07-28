"use client"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: 'user' | 'admin'
  content: string
  created_at: string
}

export default function ChatPage() {
  const { session } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const convRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session) return

    ;(async () => {
      try {
        let convId: string | null = localStorage.getItem("convId")

        if (!convId) {
          const { data: convData, error: convErr } = await supabase
            .from("conversations")
            .upsert(
              { user_id: session.user.id },
              { onConflict: 'user_id' }
            )
            .select("id")
            .single()

          console.log("🟢 Upsert result:", convData)
          console.log("🟠 Upsert error:", convErr)

          if (convErr || !convData?.id) {
            console.error("❌ No conversation ID returned from upsert")
            return
          }

          convId = convData.id
          localStorage.setItem("convId", convId)
        }

        if (!convId) {
          console.error("❌ convId is STILL undefined after upsert and localStorage")
          return
        }

        convRef.current = convId
        console.log("✅ Final convId assigned:", convId)

        const { data: msgs, error: msgErr } = await supabase
          .from<Message>("messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true })

        if (msgErr) throw msgErr
        setMessages(msgs || [])

        const channel = supabase
          .channel(`chat:${convId}`)
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${convId}`
          }, payload => {
            setMessages(prev => [...prev, payload.new as Message])
          })
          .subscribe()

        return () => supabase.removeChannel(channel)

      } catch (err) {
        console.error("Chat init error:", err)
      }
    })()
  }, [session])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !convRef.current || !session) return

    setIsSending(true)

    const payload = {
      conversation_id: convRef.current,
      sender_id: session.user.id,
      sender_role: 'user' as const,
      content: text,
    }

    const { error } = await supabase.from("messages").insert([payload])

    if (error) {
      console.error("❌ Message send error:", error)
    } else {
      setInput("")
    }

    setIsSending(false)
  }

  return (
    <div className="flex flex-col h-screen bg-purple-50">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 flex items-center shadow-md">
        <div className="flex-1">
          <h1 className="text-xl font-bold">PayGO Support</h1>
          <p className="text-xs text-purple-100">We're here to help</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center">
          <span className="text-white font-bold">PG</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-purple-50 to-white"
      >
        {messages.map(m => (
          <div
            key={m.id}
            className={`max-w-[80%] px-4 py-3 rounded-2xl break-words text-sm ${
              m.sender_role === 'user'
                ? 'bg-purple-600 text-white self-end rounded-br-none shadow-md'
                : 'bg-white text-gray-800 self-start rounded-bl-none shadow-md border border-purple-100'
            } flex-shrink-0 relative`}
          >
            {m.content}
            <span className={`absolute -bottom-5 text-xs ${
              m.sender_role === 'user' ? 'text-purple-500 right-0' : 'text-gray-500 left-0'
            }`}>
              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white flex items-center border-t border-purple-100">
        <input
          className="flex-1 border border-purple-200 rounded-full px-4 py-3 mr-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-purple-50 placeholder-purple-300"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e =>
            e.key === 'Enter' && !e.shiftKey
              ? (e.preventDefault(), sendMessage())
              : null
          }
          placeholder="Type your message..."
          disabled={!convRef.current || isSending}
        />
        <Button
          onClick={sendMessage}
          disabled={!convRef.current || isSending}
          className="p-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md"
        >
          <Send size={20} />
        </Button>
      </div>
    </div>
  )
}
