"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, UserPlus, Eye, Edit3, Trash2 } from "lucide-react"
import Image from "next/image"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('User')
        .select('id, name, email, role, createdAt, avatarUrl')
        .order('createdAt', { ascending: false })
      
      if (!error && data) {
        setUsers(data)
      } else {
        console.error("Error fetching users:", error)
      }
      setLoading(false)
    }

    fetchUsers()
  }, [])

  const deleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const { error } = await supabase.from('User').delete().eq('id', id)
      if (!error) {
        setUsers(users.filter((u) => u.id !== id))
      } else {
        console.error("Error deleting user:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-pulse text-lg text-purple-600">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24">
      {/* 3D Floating Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5 sticky top-0 z-50 shadow-2xl border-b-4 border-purple-400/30">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-wide">User Management</h1>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        {/* Header with Add User Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">All Users</h2>
          <Link
            href="/admin/users/new"
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <UserPlus className="h-5 w-5" />
            <span>Add User</span>
          </Link>
        </div>

        {/* 3D Users Table - Simplified */}
        <div className="bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                <tr>
                  <th className="p-4 text-left text-sm text-gray-600">Name</th>
                  <th className="p-4 text-left text-sm text-gray-600">Role</th>
                  <th className="p-4 text-left text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-200/50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <Image 
                            src={user.avatarUrl} 
                            alt={user.name} 
                            width={36} 
                            height={36} 
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium">
                              {user.name?.charAt(0) || user.email?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">User Details</h3>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex flex-col items-center mb-6">
                {selectedUser.avatarUrl ? (
                  <Image 
                    src={selectedUser.avatarUrl} 
                    alt={selectedUser.name} 
                    width={80} 
                    height={80} 
                    className="rounded-full mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                    <span className="text-purple-600 text-2xl font-medium">
                      {selectedUser.name?.charAt(0) || selectedUser.email?.charAt(0)}
                    </span>
                  </div>
                )}
                <h4 className="text-lg font-semibold">{selectedUser.name}</h4>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Role:</span>
                  <span className="font-medium capitalize">{selectedUser.role.toLowerCase()}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Joined:</span>
                  <span className="font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">User ID:</span>
                  <span className="font-mono text-sm">{selectedUser.id}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <Link
                  href={`/admin/users/${selectedUser.id}/edit`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Edit User
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Floating Bottom Navigation */}
      <nav className="fixed bottom-4 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 flex justify-around p-2">
        <Link href="/admin" className="flex flex-col items-center p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
          <span className="text-2xl">📊</span>
          <span className="text-xs mt-1 font-medium">Dashboard</span>
        </Link>
        <Link href="/admin/users" className="flex flex-col items-center p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
          <span className="text-2xl">👥</span>
          <span className="text-xs mt-1 font-medium">Users</span>
        </Link>
        <Link href="/admin/history" className="flex flex-col items-center p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
          <span className="text-2xl">🕒</span>
          <span className="text-xs mt-1 font-medium">History</span>
        </Link>
      </nav>
    </div>
  )
}