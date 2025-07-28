// app/admin/chat/page.tsx
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { ArrowLeft } from "lucide-react"

export default async function AdminChatListPage() {
  const { data: convs, error } = await supabaseAdmin
    .from("conversations")
    .select("id, user_id, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error loading conversations:", error)
    return <p className="p-6 text-red-600">Failed to load chats.</p>
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header with OPay-inspired gradient */}
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center">
          <Link
            href="/admin"
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="ml-4">
            <h1 className="text-xl font-semibold">Chat Support</h1>
            <p className="text-xs opacity-80">{convs?.length || 0} conversations</p>
          </div>
        </div>
      </header>

      {/* Main content with WhatsApp-like chat list */}
      <main className="pb-20">
        <div className="divide-y divide-gray-100">
          {convs?.map((c) => (
            <Link
              key={c.id}
              href={`/admin/chat/${c.id}`}
              className="flex items-center p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#4B3A8C] text-white font-bold">
                {c.user_id.slice(0, 1).toUpperCase()}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">User {c.user_id.slice(0, 6)}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">Click to view conversation</p>
              </div>
            </Link>
          ))}
        </div>

        {convs?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No conversations yet</h3>
            <p className="text-gray-500">When users start chatting, their conversations will appear here.</p>
          </div>
        )}
      </main>
    </div>
  )
}