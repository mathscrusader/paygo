"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Notification = {
  id: string
  type: "payid" | "packages" | "withdrawals"
  amount: number
  date: string
}

const labels = {
  payid: "PAY ID Request",
  packages: "Package Upgrade",
  withdrawals: "Withdrawal Request",
}

const colors = {
  payid: "text-purple-600 border-purple-200",
  packages: "text-blue-600 border-blue-200",
  withdrawals: "text-green-600 border-green-200",
}

const links = {
  payid: "/admin/payid",
  packages: "/admin/packages",
  withdrawals: "/admin/withdrawals",
}

const filterTabs = [
  { key: "all", label: "All" },
  { key: "payid", label: "PAY ID" },
  { key: "packages", label: "Packages" },
  { key: "withdrawals", label: "Withdrawals" },
]

export default function AdminNotificationsPage() {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])
  const [filtered, setFiltered] = useState<Notification[]>([])
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<"all" | "payid" | "packages" | "withdrawals">("all")
  const perPage = 10

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/notifications")
      const result = await res.json()

      const all: Notification[] = result.data.sort(
        (a: Notification, b: Notification) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      setAllNotifications(all)
    }

    load()
  }, [])

  useEffect(() => {
    setPage(1)
    setFiltered(
      filter === "all" ? allNotifications : allNotifications.filter(n => n.type === filter)
    )
  }, [filter, allNotifications])

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      {/* Header */}
      <header className="bg-[#34296B] text-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => history.back()}
            className="text-white hover:underline text-sm"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold">Notifications</h1>
        </div>
      </header>

      {/* Horizontal filter buttons */}
      <div className="px-4 pt-4 flex flex-wrap gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1 text-sm rounded-full border ${
              filter === tab.key
                ? "bg-[#34296B] text-white border-[#34296B]"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="p-4 max-w-3xl mx-auto">
        {filtered.length === 0 ? (
          <div className="bg-white text-center text-gray-500 py-12 rounded-xl shadow-sm mt-10">
            🎉 No new notifications found.
          </div>
        ) : (
          <div className="space-y-4">
            {paginated.map((n) => (
              <div
                key={n.id}
                className={`bg-white border rounded-xl shadow-sm p-4 flex justify-between items-center ${colors[n.type]}`}
              >
                <div>
                  <p className="font-semibold text-sm">{labels[n.type]}</p>
                  <p className="text-sm text-gray-600">₦{n.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.date).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={links[n.type]}
                  className={`text-xs font-semibold underline ${colors[n.type].split(" ")[0]}`}
                >
                  View
                </Link>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 text-sm rounded ${
                      p === page
                        ? "bg-[#34296B] text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-inner border-t border-gray-200 flex justify-around py-2">
        <Link href="/admin" className="flex flex-col items-center text-sm text-gray-700">
          <div>📊</div>
          <span>Dashboard</span>
        </Link>
        <Link href="/admin/packages" className="flex flex-col items-center text-sm text-gray-700">
          <div>📦</div>
          <span>Packages</span>
        </Link>
        <Link href="/admin/withdrawals" className="flex flex-col items-center text-sm text-gray-700">
          <div>💰</div>
          <span>Withdrawals</span>
        </Link>
        <Link href="/admin/users" className="flex flex-col items-center text-sm text-gray-700">
          <div>👥</div>
          <span>Users</span>
        </Link>
      </nav>
    </div>
  )
}
