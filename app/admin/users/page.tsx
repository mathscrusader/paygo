'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Modal from '@/components/Modal'
import { ArrowLeft, Search, MessageSquare, Ban, Eye, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Link from 'next/link'

type User = {
  id: string
  full_name: string
  email: string
  is_suspended: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'suspended'
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isSuspending, setIsSuspending] = useState(false)

  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const fetchUsers = useCallback(
    async (currentPage: number, search: string, status: string) => {
      setLoading(true)
      setError(null)
      try {
        const from = (currentPage - 1) * perPage
        const to = from + perPage - 1

        let query = supabase
          .from('profiles')
          .select('id, full_name, email, is_suspended', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to)

        if (search) {
          query = query.ilike('full_name', `%${search}%`)
        }

        if (status === 'active') {
          query = query.eq('is_suspended', false)
        } else if (status === 'suspended') {
          query = query.eq('is_suspended', true)
        }

        const { data, error, count } = await query

        if (error) throw error

        setUsers(data || [])
        setTotalUsers(count || 0)
      } catch (err: any) {
        setError(err.message)
        toast({
          title: 'Error fetching users',
          description: err.message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [supabase, perPage, toast]
  )

  useEffect(() => {
    fetchUsers(page, searchTerm, statusFilter)
  }, [page, searchTerm, statusFilter, fetchUsers])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

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

  const handleNext = () => {
    if (page * perPage < totalUsers) {
      setPage(page + 1)
    }
  }

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const openModal = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedUser(null)
    setIsModalOpen(false)
  }

  const handleSendMessage = async (message: string, title: string) => {
    if (!selectedUser) return
    setIsSending(true)
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_ids: [selectedUser.id],
          title,
          message,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send message')
      }
      toast({
        title: 'Message Sent',
        description: `Your message has been sent to ${selectedUser.full_name}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
      closeModal()
    }
  }

  const handleSendToSelected = () => {
    if (selectedUsers.length > 0) {
      setIsBulkModalOpen(true)
    } else {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to send a message.',
        variant: 'destructive',
      })
    }
  }

  const handleSendToAll = () => {
    setSelectedUsers([]) // Ensure selection is cleared for "all"
    setIsBulkModalOpen(true)
  }

  const handleSendBulkMessage = async (message: string, title: string) => {
    setIsSending(true)
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_ids: selectedUsers.length > 0 ? selectedUsers : undefined, // If empty, API sends to all
          title,
          message,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send bulk message')
      }
      toast({
        title: 'Bulk Message Sent',
        description: `Your message has been sent to ${
          selectedUsers.length > 0 ? `${selectedUsers.length} users` : 'all users'
        }.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
      setIsBulkModalOpen(false)
    }
  }

  const handleToggleSuspension = async (user: User) => {
    setIsSuspending(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_suspended: !user.is_suspended }),
      })

      if (res.ok) {
        toast({
          title: user.is_suspended ? 'User Unsuspended' : 'User Suspended',
          description: user.is_suspended
            ? 'The user has been unsuspended and can now access their account.'
            : 'The user has been suspended and cannot access their account.',
        })
        // Refresh list to show updated status
        fetchUsers(page, searchTerm, statusFilter)
      } else {
        const data = await res.json()
        throw new Error(
          data.message || 'Failed to update user suspension status'
        )
      }
    } catch (error: any) {
      console.error('Failed to update suspension status:', error)
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
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
          {/* Filter and Action Buttons */}
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Filter Tabs */}
              <Select onValueChange={(value) => setStatusFilter(value)} value={statusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    className="bg-purple-700 text-white hover:bg-purple-800 rounded-full px-6 py-2 shadow-lg transform hover:scale-105 transition-all"
                  >
                    Message <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={handleSendToSelected}
                    disabled={selectedUsers.length === 0}
                  >
                    Send to Selected ({selectedUsers.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendToAll}>
                    Send to All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        <div className="border-t">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-purple-100">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-2 py-3">
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={
                              users.length > 0 &&
                              selectedUsers.length === users.length
                            }
                          />
                        </th>
                        <th className="px-2 py-4 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">
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
                            <td className="px-2 py-4">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleSelectUser(user.id)}
                              />
                            </td>
                            <td className="px-2 py-4">
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
                            <td className="px-6 py-4 text-right text-sm font-medium">
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
                                  className={
                                    user.is_suspended
                                      ? 'text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 transition-colors'
                                      : 'text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors'
                                  }
                                  title={
                                    user.is_suspended
                                      ? 'Unsuspend User'
                                      : 'Suspend User'
                                  }
                                >
                                  <Ban
                                    className={`w-5 h-5 ${
                                      user.is_suspended
                                        ? 'text-blue-600'
                                        : 'text-red-600'
                                    }`}
                                  />
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
                        ? 'text-purple-300 cursor-not-allowed'
                        : 'text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-purple-600 font-medium">
                    Page {page} of {Math.ceil(totalUsers / perPage)}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={page * perPage >= totalUsers}
                    className={`px-4 py-2 rounded-md font-medium ${
                      page * perPage >= totalUsers
                        ? 'text-purple-300 cursor-not-allowed'
                        : 'text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
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
        userName={
          selectedUsers.length > 0
            ? `${selectedUsers.length} users`
            : 'all users'
        }
        isSending={isSending}
      />
    </div>
  )
}


function SendMessageModal({
  isOpen,
  onClose,
  onSend,
  userName,
  isSending,
}: {
  isOpen: boolean
  onClose: () => void
  onSend: (message: string, title: string) => void
  userName: string
  isSending: boolean
}) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    onSend(title, message)
    setTitle('')
    setMessage('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">
          Send Message to {userName}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter message title"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              placeholder="Enter your message"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !title.trim() || !message.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}