"use client"

import { useState } from "react"
import { MessageSquare, Ban, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function UserActions({ user }: { user: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSuspending, setIsSuspending] = useState(false)
  const { toast } = useToast()

  const handleSendMessage = async (title: string, message: string) => {
    setIsSending(true)
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, title, message }),
      })

      if (res.ok) {
        toast({
          title: "Message Sent",
          description: "The message has been sent to the user.",
        })
        setIsModalOpen(false)
      } else {
        const data = await res.json()
        throw new Error(data.message || 'Failed to send message')
      }
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleToggleSuspension = async () => {
    setIsSuspending(true)
    try {
      const res = await fetch("/api/admin/users/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          suspend: !user.is_suspended 
        }),
      })

      if (res.ok) {
        toast({
          title: user.is_suspended ? "User Unsuspended" : "User Suspended",
          description: user.is_suspended 
            ? "The user has been unsuspended and can now access their account." 
            : "The user has been suspended and cannot access their account.",
        })
        // Update the user object to reflect the new suspension status
        user.is_suspended = !user.is_suspended
      } else {
        const data = await res.json()
        throw new Error(data.message || 'Failed to update user suspension status')
      }
    } catch (error: any) {
      console.error('Failed to update suspension status:', error)
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      })
    } finally {
      setIsSuspending(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Send Message
        </button>
        <button
          onClick={handleToggleSuspension}
          disabled={isSuspending}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${user.is_suspended ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"} ${isSuspending ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {user.is_suspended ? (
            <>
              <Check className="w-4 h-4" />
              Unsuspend
            </>
          ) : (
            <>
              <Ban className="w-4 h-4" />
              Suspend
            </>
          )}
        </button>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_admin
              ? "bg-purple-100 text-purple-800 border border-purple-200"
              : "bg-white text-purple-700 border border-purple-200"
            }`}
        >
          {user.is_admin ? "Admin" : "User"}
        </span>
        {user.is_suspended && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            Suspended
          </span>
        )}
      </div>
      <SendMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={handleSendMessage}
        userName={user.full_name}
        isSending={isSending}
      />
    </>
  )
}

interface SendMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (title: string, message: string) => void
  userName: string
  isSending: boolean
}

function SendMessageModal({
  isOpen,
  onClose,
  onSend,
  userName,
  isSending,
}: SendMessageModalProps) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(title, message)
    // Keep modal open until sending is complete
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Send Message to {userName}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}