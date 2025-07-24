// app/admin/history/page.tsx
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  DollarSign,
  Banknote,
} from "lucide-react"

type TxRow = {
  id: string
  number: string
  amount: number
  createdAt: string
  status: string
  approved: boolean
  userId: string | null
  bankId?: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
}

export default async function HistoryPage() {
  // Auth guard
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/auth/signin")
  }

  /** 1) Get all transactions (NO joins) */
  const { data: txData, error: txErr } = await supabase
    .from<TxRow>("Transaction")
    .select("id, number, amount, createdAt, status, approved, userId, bankId")
    .order("createdAt", { ascending: false })

  if (txErr) {
    console.error("Error loading history:", txErr)
    return (
      <div className="p-4 bg-red-100 text-red-600 rounded-xl mx-4 my-2 shadow-sm border border-red-200">
        Failed to load history: {txErr.message}
      </div>
    )
  }

  const transactions = txData ?? []

  /** 2) Fetch profiles for referenced users */
  const userIds = Array.from(
    new Set(transactions.map(t => t.userId).filter(Boolean))
  ) as string[]

  let userMap: Record<string, ProfileRow> = {}
  if (userIds.length > 0) {
    const { data: profiles, error: profErr } = await supabase
      .from<ProfileRow>("profiles")
      .select("id, full_name, email")
      .in("id", userIds)

    if (profErr) {
      console.error("Error loading profiles:", profErr)
    } else if (profiles) {
      userMap = Object.fromEntries(profiles.map(p => [p.id, p]))
    }
  }

  /** 3) Enrich tx list with user info */
  const enriched = transactions.map(tx => {
    const u = tx.userId ? userMap[tx.userId] : undefined
    return {
      ...tx,
      user: {
        name: u?.full_name || "",
        email: u?.email || "",
      },
    }
  })

  /** 4) Stats */
  const totalTransactions = enriched.length
  const approvedTransactions = enriched.filter(tx => tx.approved).length
  const pendingTransactions = totalTransactions - approvedTransactions
  const totalAmount = enriched.reduce((sum, tx) => sum + (tx.amount || 0), 0)

  const uniqueUsers = new Set(enriched.map(tx => tx.userId).filter(Boolean)).size
  // bankId may not exist; handle safely
  const banksCount = enriched.some(tx => typeof tx.bankId !== "undefined")
    ? new Set(enriched.map(tx => tx.bankId).filter(Boolean)).size
    : 0

  const formatNaira = (n: number) =>
    "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Transaction History</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="p-4">
        {/* Summary Cards - 2 rows of 3 columns */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Total Txns */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-b-2 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Txns</p>
                  <p className="text-lg font-bold text-purple-700 mt-1">
                    {totalTransactions}
                  </p>
                </div>
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            {/* Approved */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-b-2 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Approved</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {approvedTransactions}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>
            {/* Pending */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-b-2 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pending</p>
                  <p className="text-lg font-bold text-yellow-600 mt-1">
                    {pendingTransactions}
                  </p>
                </div>
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Total Amount */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-b-2 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    {formatNaira(totalAmount)}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            {/* Users */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-b-2 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Users</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">
                    {uniqueUsers}
                  </p>
                </div>
                <User className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            {/* Banks */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-b-2 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Banks</p>
                  <p className="text-lg font-bold text-red-600 mt-1">
                    {banksCount || "-"}
                  </p>
                </div>
                <Banknote className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {enriched.map(tx => (
            <div
              key={tx.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-1.5 rounded-full ${
                      tx.status === "success"
                        ? "bg-green-100 text-green-600"
                        : tx.status === "failed"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {tx.status === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : tx.status === "failed" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.user?.name || tx.user?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">#{tx.number}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      tx.approved ? "text-green-600" : "text-purple-700"
                    }`}
                  >
                    {formatNaira(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    tx.approved
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {tx.approved ? "Approved" : "Pending"}
                </span>

                <Link
                  href={`/admin/transactions/${tx.id}`}
                  className="text-xs px-3 py-1 text-purple-600 hover:bg-purple-50 rounded-lg"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 flex justify-around py-2">
        <Link href="/admin" className="flex flex-col items-center p-1 text-purple-600">
          <span className="text-xl">📊</span>
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        <Link href="/admin/transactions" className="flex flex-col items-center p-1 text-gray-500">
          <span className="text-xl">💳</span>
          <span className="text-xs mt-1">Transactions</span>
        </Link>
        <Link href="/admin/history" className="flex flex-col items-center p-1 text-gray-500">
          <span className="text-xl">🕒</span>
          <span className="text-xs mt-1">History</span>
        </Link>
        <Link href="/admin/users" className="flex flex-col items-center p-1 text-gray-500">
          <span className="text-xl">👥</span>
          <span className="text-xs mt-1">Users</span>
        </Link>
      </nav>
    </div>
  )
}
