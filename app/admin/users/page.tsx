"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Eye, MessageSquare, Search, Ban } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// We need a separate modal component to avoid re-rendering the whole page
function SendMessageModal({
  isOpen,
  onClose,
  onSend,
  userName,
  isSending,
}: {
  isOpen: boolean
  onClose: () => void
  onSend: (title: string, message: string) => void
  userName: string
  isSending: boolean
}) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(title, message)
    setTitle("")
    setMessage("")
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

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isSending, setIsSending] = useState(false)
  const [isSuspending, setIsSuspending] = useState(false)
  const { toast } = useToast()
  const perPage = 10

  const fetchUsers = async (pageNum = 1, term = "") => {
    setLoading(true)
    const offset = (pageNum - 1) * perPage
  
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, is_suspended", { count: "exact" })
      .order("full_name", { ascending: true })
      .range(offset, offset + perPage - 1)
  
    if (term.length >= 3) {
      query = query.ilike("full_name", `${term}%`)
    }
  
    const { data, error } = await query
  
    if (error) {
      console.error("Error fetching users:", error)
      setUsers([])
    } else {
      setUsers(data)
    }
  
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers(page, searchTerm)
  }, [page, searchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  const handleNext = () => setPage((prev) => prev + 1)
  const handlePrev = () => setPage((prev) => (prev > 1 ? prev - 1 : 1))

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(users.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const openModal = (user: any) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedUser(null)
    setIsModalOpen(false)
  }

  const handleSendMessage = async (title: string, message: string) => {
    if (!selectedUser) return
    setIsSending(true)
    try { // Added try-catch block for better error handling
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, title, message }),
      })

      if (res.ok) {
        toast({
          title: "Message Sent",
          description: "The message has been sent to the user.",
        })
        closeModal()
      } else {
        const data = await res.json()
        throw new Error(data.message || 'Failed to send message') // Throw error to be caught by catch block
      }
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendBulkMessage = async (title: string, message: string) => {
    const userIds = selectedUsers.length > 0 ? selectedUsers : users.map(u => u.id);
    if (userIds.length === 0) {
        toast({
            title: "No users selected",
            description: "Please select users to send a message to.",
            variant: "destructive",
        });
        return;
    }

    setIsSending(true)
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds, title, message }),
    })

    if (res.ok) {
      toast({
        title: "Messages Sent",
        description: `The message has been sent to ${userIds.length} users.`,
      })
      setIsBulkModalOpen(false)
      setSelectedUsers([])
    } else {
      toast({
        title: "Error",
        description: "Failed to send messages.",
        variant: "destructive",
      })
    }
    setIsSending(false)
  }

  const handleToggleSuspension = async (user: any) => {
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
        // Refresh the user list to show updated status
        fetchUsers(page, searchTerm)
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
    <div className="container mx-auto px-4 min-h-screen bg-purple-50">
      {/* Purple Header Section */}
      <div className="bg-purple-700 text-white px-6 py-4 rounded-b-lg shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-purple-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Admin</span>
          </Link>

          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-purple-300" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-purple-500 rounded-lg bg-purple-800 text-white placeholder-purple-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-4 flex justify-end gap-2">
            <button
                onClick={() => setIsBulkModalOpen(true)}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
                Send to Selected ({selectedUsers.length})
            </button>
            <button
                onClick={() => {
                    setSelectedUsers([]); // Clear selections
                    setIsBulkModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
                Send to All
            </button>
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-purple-100">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-3">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={
                            users.length > 0 &&
                            selectedUsers.length === users.length
                          }
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-purple-100">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-purple-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-purple-900">
                              {user.full_name}
                              {user.is_suspended && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">
                                  Suspended
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-purple-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => openModal(user)}
                                className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100 transition-colors"
                                title="Send Message"
                              >
                                <MessageSquare className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleToggleSuspension(user)}
                                disabled={isSuspending}
                                className={user.is_suspended 
                                  ? "text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 transition-colors" 
                                  : "text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors"}
                                title={user.is_suspended ? "Unsuspend User" : "Suspend User"}
                              >
                                <Ban className={`w-5 h-5 ${user.is_suspended ? "text-blue-600" : "text-red-600"}`} />
                              </button>
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-100 transition-colors"
                                title="View"
                              >
                                <Eye className="w-5 h-5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center"
                        >
                          <div className="text-purple-500">
                            No users found
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-purple-50 px-6 py-3 flex items-center justify-between border-t border-purple-100">
                <button
                  onClick={handlePrev}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-md font-medium ${
                    page === 1
                      ? "text-purple-300 cursor-not-allowed"
                      : "text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-purple-600 font-medium">
                  Page {page}
                </span>
                <button
                  onClick={handleNext}
                  disabled={users.length < perPage}
                  className={`px-4 py-2 rounded-md font-medium ${
                    users.length < perPage
                      ? "text-purple-300 cursor-not-allowed"
                      : "text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {selectedUser && (
        <SendMessageModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSend={handleSendMessage}
          userName={selectedUser.full_name}
          isSending={isSending}
        />
      )}
       <SendMessageModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSend={handleSendBulkMessage}
        userName={selectedUsers.length > 0 ? `${selectedUsers.length} users` : "all users"}
        isSending={isSending}
      />
    </div>
  )
}