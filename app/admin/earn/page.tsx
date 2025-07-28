"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface UserEarning {
  id: string
  full_name: string | null
  email: string | null
  reward_balance: number
  created_at: string
}

export default function AdminEarnPage() {
  const [users, setUsers] = useState<UserEarning[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsersWithEarnings = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, reward_balance, created_at")
        .gt("reward_balance", 0)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching earnings:", error)
      } else {
        setUsers(data || [])
      }
      setLoading(false)
    }

    fetchUsersWithEarnings()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hover:underline text-sm flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-lg font-bold">Referral Earnings Report</h1>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center py-12 text-purple-600 animate-pulse">Loading earnings...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No referral earnings found.</div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Total Earned</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {user.full_name || "Unnamed"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email || "-"}</td>
                    <td className="px-4 py-3 text-green-700 font-semibold">
                      ₦{user.reward_balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
