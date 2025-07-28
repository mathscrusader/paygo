"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, UserPlus, Eye, Edit3, Trash2 } from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [page, setPage] = useState(1)
  const perPage = 10

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at, is_admin")
        .order("created_at", { ascending: false })

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
    if (confirm("Are you sure you want to delete this user?")) {
      const { error } = await supabase.from("profiles").delete().eq("id", id)
      if (!error) {
        setUsers(users.filter((u) => u.id !== id))
      } else {
        console.error("Error deleting user:", error)
      }
    }
  }

  const paginated = users.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(users.length / perPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-pulse text-md text-purple-600">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-16">
      <header className="bg-[#34296B] text-white p-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-white/10 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">User Management</h1>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#34296B]">All Users</h2>
          <Link
            href="/admin/users/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#34296B] text-white text-sm rounded-md shadow hover:bg-[#4B3A8C] transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </Link>
        </div>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => (
                <tr
                  key={user.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-medium text-gray-800">{user.full_name}</td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.is_admin ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded"
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

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 text-sm rounded ${
                  p === page ? "bg-[#34296B] text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
