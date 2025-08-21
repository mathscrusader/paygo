'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

import { ArrowLeft, Search, Ban, ChevronDown, Eye } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Link from 'next/link'

type User = {
  id: string
  full_name: string
  email: string
  is_suspended: boolean
  whatsapp_number: string | null
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
          .select('id, full_name, email, is_suspended, whatsapp_number', { count: 'exact' })
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
      <div className="bg-purple-700 text-white px-6 py-4 rounded-b-lg shadow-md max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
      <div className="max-w-7xl mx-auto">
          {/* Filter and Action Buttons - Centered above table */}
          <div className="flex justify-center gap-4 items-center mb-6 mt-4">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-green-600 border border-green-300 hover:bg-green-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                statusFilter === 'suspended'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-red-600 border border-red-300 hover:bg-red-50'
              }`}
            >
              Suspended
            </button>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="px-4 py-2 rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Show All
              </button>
            )}
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
                                {user.whatsapp_number ? (
                                  <a
                                    href={`https://wa.me/${user.whatsapp_number}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100 transition-colors"
                                    title="Chat on WhatsApp"
                                  >
                                    <FaWhatsapp className="w-5 h-5" />
                                  </a>
                                ) : null}
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
                            colSpan={2}
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

    </div>
  )
}