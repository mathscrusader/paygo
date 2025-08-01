"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Eye, Search } from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const perPage = 10

  const fetchUsers = async (pageNum = 1, term = "") => {
    setLoading(true)
    const offset = (pageNum - 1) * perPage

    let query = supabase
      .from("profiles")
      .select("id, full_name, email", { count: 'exact' })
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

  const handleNext = () => setPage(prev => prev + 1)
  const handlePrev = () => setPage(prev => (prev > 1 ? prev - 1 : 1))

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
                      <th className="px-6 py-4 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-purple-100">
                    {users.length > 0 ? users.map((user) => (
                      <tr key={user.id} className="hover:bg-purple-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-purple-900">{user.full_name}</div>
                          <div className="text-xs text-purple-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
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
                    )) : (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center">
                          <div className="text-purple-500">No users found</div>
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
                  className={`px-4 py-2 rounded-md font-medium ${page === 1 ? 'text-purple-300 cursor-not-allowed' : 'text-purple-700 hover:bg-purple-100'}`}
                >
                  Previous
                </button>
                <span className="text-sm text-purple-600 font-medium">
                  Page {page}
                </span>
                <button
                  onClick={handleNext}
                  disabled={users.length < perPage}
                  className={`px-4 py-2 rounded-md font-medium ${users.length < perPage ? 'text-purple-300 cursor-not-allowed' : 'text-purple-700 hover:bg-purple-100'}`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
