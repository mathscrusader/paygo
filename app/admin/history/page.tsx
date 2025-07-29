// app/admin/history/page.tsx
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin"
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

export default async function HistoryPage({ searchParams }: { searchParams: any }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/auth/signin")
  }

  const { data: txData, error: txErr } = await supabase
    .from<TxRow>("Transaction")
    .select("id, number, amount, createdAt, status, approved, userId, bankId")
    .order("createdAt", { ascending: false })

  if (txErr) {
    console.error("Error loading history:", txErr)
    return <div className="p-4 text-red-600">Failed to load: {txErr.message}</div>
  }

  const transactions = txData ?? []

  // Join with profiles
  const userIds = Array.from(
    new Set(transactions.map(t => t.userId).filter(Boolean))
  ) as string[]

  let userMap: Record<string, ProfileRow> = {}
  if (userIds.length > 0) {
    const { data: profiles, error: profErr } = await supabase
      .from<ProfileRow>("profiles")
      .select("id, full_name, email")
      .in("id", userIds)

    if (!profErr && profiles) {
      userMap = Object.fromEntries(profiles.map(p => [p.id, p]))
    }
  }

  const enriched = transactions.map(tx => {
    const u = userMap[tx.userId || ""] || {}
    return {
      ...tx,
      user: {
        name: u.full_name || "Unknown",
        email: u.email || "",
      },
    }
  })

  // Pagination
  const ITEMS_PER_PAGE = 10
  const page = parseInt(searchParams?.page || "1", 10)
  const totalPages = Math.ceil(enriched.length / ITEMS_PER_PAGE)
  const paginated = enriched.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Stats
  const totalTransactions = enriched.length
  const approvedTransactions = enriched.filter(tx => tx.approved).length
  const pendingTransactions = totalTransactions - approvedTransactions
  const totalAmount = enriched.reduce((sum, tx) => sum + (tx.amount || 0), 0)
  const uniqueUsers = new Set(enriched.map(tx => tx.userId).filter(Boolean)).size
  const banksCount = new Set(enriched.map(tx => tx.bankId).filter(Boolean)).size

  const formatNaira = (n: number) =>
    "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-20">
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
        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <SummaryCard label="Total Txns" value={totalTransactions} icon={<Clock />} color="purple" />
          <SummaryCard label="Approved" value={approvedTransactions} icon={<CheckCircle />} color="green" />
          <SummaryCard label="Pending" value={pendingTransactions} icon={<AlertCircle />} color="yellow" />
          <SummaryCard label="Total Amount" value={formatNaira(totalAmount)} icon={<DollarSign />} color="blue" />
          <SummaryCard label="Users" value={uniqueUsers} icon={<User />} color="indigo" />
          <SummaryCard label="Banks" value={banksCount || "-"} icon={<Banknote />} color="red" />
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {paginated.map(tx => (
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
                      {tx.user.name || tx.user.email || "Unknown"}
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
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <Link
              key={i}
              href={`/admin/history?page=${i + 1}`}
              className={`px-3 py-1 rounded-full text-sm ${
                i + 1 === page
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

// Reusable summary card
function SummaryCard({ label, value, icon, color }: any) {
  const colorMap: any = {
    purple: "border-purple-500 text-purple-700",
    green: "border-green-500 text-green-600",
    yellow: "border-yellow-500 text-yellow-600",
    blue: "border-blue-500 text-blue-600",
    indigo: "border-indigo-500 text-indigo-600",
    red: "border-red-500 text-red-600",
  }

  return (
    <div className={`bg-white p-3 rounded-xl shadow-sm border-b-2 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className={`text-lg font-bold mt-1`}>{value}</p>
        </div>
        <div className={`${colorMap[color].split(" ")[1]}`}>{icon}</div>
      </div>
{/* 📱 Mobile Bottom Navigation */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-xl rounded-t-2xl z-50">
        <nav className="flex justify-around items-center py-2">
          <Link href="/admin" className="flex flex-col items-center text-gray-700 hover:text-purple-600 text-sm">
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-0.5">Home</span>
          </Link>
          <Link href="/admin/packages" className="flex flex-col items-center text-gray-700 hover:text-blue-600 text-sm">
            <span className="text-xl">📦</span>
            <span className="text-xs mt-0.5">Packages</span>
          </Link>
          <Link href="/admin/withdrawals" className="flex flex-col items-center text-gray-700 hover:text-green-600 text-sm">
            <span className="text-xl">💰</span>
            <span className="text-xs mt-0.5">Withdraw</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col items-center text-gray-700 hover:text-indigo-600 text-sm">
            <span className="text-xl">👥</span>
            <span className="text-xs mt-0.5">Users</span>
          </Link>
        </nav>
      </footer>

  



    </div>
  )
}
