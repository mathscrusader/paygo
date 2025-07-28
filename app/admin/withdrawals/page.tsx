"use client"

import { useEffect, useState } from "react"
import Modal from "@/components/Modal"

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  bank_name: string
  account_name: string
  account_number: string
  status: string
  method: string
  created_at: string
  profiles?: {
    full_name: string
  }
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [filtered, setFiltered] = useState<Withdrawal[]>([])
  const [paginated, setPaginated] = useState<Withdrawal[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<Withdrawal | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  const PER_PAGE = 10

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals")
      const result = await res.json()
      if (res.ok) {
        const data = result.data || []
        setWithdrawals(data.sort((a: Withdrawal, b: Withdrawal) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
      } else {
        console.error("Error fetching:", result.error)
      }
    } catch (err) {
      console.error("Fetch failed:", err)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await res.json()
      if (!res.ok) {
        setMessage("❌ " + result.error)
      } else {
        setMessage(`✅ Marked as ${newStatus}`)
        fetchWithdrawals()
      }
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Update failed:", err)
      setMessage("❌ Network error")
      setTimeout(() => setMessage(null), 3000)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
    const interval = setInterval(fetchWithdrawals, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const filteredData =
      filter === "all" ? withdrawals : withdrawals.filter(w => w.status === filter)
    setFiltered(filteredData)
    setCurrentPage(1)
  }, [withdrawals, filter])

  useEffect(() => {
    const start = (currentPage - 1) * PER_PAGE
    setPaginated(filtered.slice(start, start + PER_PAGE))
  }, [filtered, currentPage])

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 relative">
      
      <header className="bg-[#34296B] text-white p-4 rounded-lg shadow mb-6">
        <button
  onClick={() => window.history.back()}
  className="mb-4 flex items-center text-sm text-[#ffffff] hover:underline"
>
  ← Back to previous page
</button>

        <h1 className="text-lg font-bold">Withdrawal Requests</h1>
        <p className="text-sm opacity-80">View and manage user withdrawals</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button
            key={f}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === f
                ? "bg-[#34296B] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setFilter(f as any)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {message && (
        <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white shadow-xl border border-gray-200 px-6 py-3 rounded-lg text-center font-medium text-sm">
          {message}
        </div>
      )}

      {paginated.length === 0 ? (
        <div className="bg-white rounded-lg p-6 text-center text-gray-500">
          No withdrawals found.
        </div>
      ) : (
        <div className="space-y-4">
          {paginated.map(w => (
            <div
              key={w.id}
              onClick={() => setSelected(w)}
              className="cursor-pointer bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-[#34296B]">
                    {w.profiles?.full_name || w.user_id}
                  </h3>
                  <p className="text-xs text-gray-500">
                    ₦{w.amount.toLocaleString()}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(w.created_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 flex justify-between items-center text-sm">
  <button
    onClick={() => setSelected(w)}
    className="text-blue-600 hover:underline font-medium text-sm"
  >
    View withdrawal details
  </button>
  <span
    className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
      w.status === "approved"
        ? "bg-green-100 text-green-700"
        : w.status === "pending"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    {w.status}
  </span>
</div>


            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: Math.ceil(filtered.length / PER_PAGE) }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === i + 1
                ? "bg-[#34296B] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Modal for full details */}
      {selected && (
        <Modal title="Withdrawal Details" onClose={() => setSelected(null)}>
          <div className="space-y-2 text-gray-700 text-sm">
            <div>
              <strong>User:</strong> {selected.profiles?.full_name || selected.user_id}
            </div>
            <div>
              <strong>Amount:</strong> ₦{selected.amount.toLocaleString()}
            </div>
            <div>
              <strong>Bank:</strong> {selected.bank_name}
            </div>
            <div>
              <strong>Account:</strong> {selected.account_name} ({selected.account_number})
            </div>
            <div>
              <strong>Method:</strong> {selected.method}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                className={`font-semibold ${
                  selected.status === "approved"
                    ? "text-green-600"
                    : selected.status === "pending"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {selected.status}
              </span>
            </div>
            <div>
              <strong>Date:</strong>{" "}
              {new Date(selected.created_at).toLocaleString()}
            </div>
            {selected.status === "pending" && (
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    updateStatus(selected.id, "approved")
                    setSelected(null)
                  }}
                  className="px-4 py-1 rounded bg-green-600 text-white text-xs font-semibold"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    updateStatus(selected.id, "rejected")
                    setSelected(null)
                  }}
                  className="px-4 py-1 rounded bg-red-600 text-white text-xs font-semibold"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
