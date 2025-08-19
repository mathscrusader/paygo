// app/admin/page.tsx
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/auth/signin")
  }

  // Fetch counts
  const [
    totalTxRes,
    pendingTxRes,
    approvedTxRes,
    todayTxRes,
    aggRowsRes,
    userCountRes,
    payIdNotificationRes,
    packageNotificationRes,
    withdrawalNotificationRes,
  ] = await Promise.all([
    supabaseAdmin.from("Transaction").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("Transaction").select("id", { count: "exact", head: true }).eq("approved", false),
    supabaseAdmin.from("Transaction").select("id", { count: "exact", head: true }).eq("approved", true),
    (async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const { count } = await supabaseAdmin
        .from("Transaction")
        .select("id", { count: "exact", head: true })
        .gte("createdAt", start.toISOString())
      return { count }
    })(),
    supabaseAdmin.from("Transaction").select("amount,status,approved,type"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("Transaction").select("id", { count: "exact", head: true })
      .eq("type", "activation").eq("status", "PENDING").eq("approved", false),
    supabaseAdmin.from("Transaction").select("id", { count: "exact", head: true })
      .eq("type", "upgrade").eq("status", "PENDING").eq("approved", false),
    supabaseAdmin.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ])

  const totalTransactions = totalTxRes.count ?? 0
  const pendingCount = pendingTxRes.count ?? 0
  const approvedCount = approvedTxRes.count ?? 0
  const todayCount = todayTxRes.count ?? 0
  const userCount = userCountRes.count ?? 0

  // Aggregate amounts
  let sumPending = 0
  let sumApproved = 0
  const byType: Record<string, { count: number; total: number }> = {}
  if (aggRowsRes.data) {
    for (const r of aggRowsRes.data) {
      const status = (r.status || "").toLowerCase()
      if (status === "pending") sumPending += r.amount ?? 0
      if (r.approved) sumApproved += r.amount ?? 0
      const t = r.type ?? "unknown"
      if (!byType[t]) byType[t] = { count: 0, total: 0 }
      byType[t].count++
      byType[t].total += r.amount ?? 0
    }
  }

  const approvalRate = totalTransactions ? Math.round((approvedCount / totalTransactions) * 100) : 0
  const payIdNotificationCount = payIdNotificationRes.count ?? 0
  const packageNotificationCount = packageNotificationRes.count ?? 0
  const withdrawalNotificationCount = withdrawalNotificationRes.count ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5 sticky top-0 z-50 shadow-2xl border-b-4 border-purple-400/30">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg border-2 border-white/20">
              <span className="text-white font-bold text-lg">
                {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">Admin Dashboard</h1>
              <p className="text-xs text-purple-100/90">
                {session.user.name || session.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-5">
            {/* Notifications Button */}
            <Link href="/admin/notifications" className="relative group">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-xl">🔔</span>
                {(payIdNotificationCount + packageNotificationCount + withdrawalNotificationCount) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-md">
                    {payIdNotificationCount + packageNotificationCount + withdrawalNotificationCount}
                  </span>
                )}
              </div>
            </Link>
            <span className="px-3 py-1 text-xs font-bold bg-white/20 text-white rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
              ADMIN
            </span>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {/* Pending */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-purple-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{pendingCount}</p>
              </div>
              <div className="text-purple-600 text-2xl">⏱️</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">₦{sumPending.toLocaleString()} pending</p>
          </div>

          {/* Today's Txns */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Today's Txns</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{todayCount}</p>
              </div>
              <div className="text-blue-600 text-2xl">💰</div>
            </div>
          </div>

          {/* Total Txns */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-indigo-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Txns</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalTransactions}</p>
              </div>
              <div className="text-indigo-600 text-2xl">🧾</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">₦{sumApproved.toLocaleString()} approved</p>
          </div>

          {/* Approval Rate */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-yellow-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{approvalRate}%</p>
              </div>
              <div className="text-yellow-600 text-2xl">📊</div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{userCount}</p>
              </div>
              <div className="text-green-600 text-2xl">👥</div>
            </div>
          </div>
        </div>

        {/* Transactions by Type */}
        {Object.keys(byType).length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4 ml-1">Transactions by Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Object.entries(byType).map(([t, v]) => (
                <div key={t} className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-gray-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium capitalize">{t} Txns</p>
                      <p className="text-xl font-bold text-gray-800 mt-1">{v.count}</p>
                      <p className="text-xs text-gray-500">₦{v.total.toLocaleString()}</p>
                    </div>
                    <div className="text-gray-600 text-2xl">📂</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 ml-1">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              "payid",
              "packages",
              "withdrawals",
              "history",
              "earn",
              "users",
              "banks",
              "promotions",
            ].map((href, i) => {
              const icons = ["🆔","📦","💰","🕒","💸","👥","🏦","🎁"]
              const labels = ["PAY IDs","Packages","Withdrawals","History","Earn","Users","Banks","Promotion"]
              const colors = ["purple","blue","green","yellow","red","indigo","cyan","pink"]

              const badgeCount =
                href === "payid"
                  ? payIdNotificationCount
                  : href === "packages"
                  ? packageNotificationCount
                  : href === "withdrawals"
                  ? withdrawalNotificationCount
                  : 0

              return (
                <Link
                  key={href}
                  href={`/admin/${href}`}
                  className={`bg-gradient-to-br from-${colors[i]}-100 to-${colors[i]}-50 p-4 rounded-2xl shadow-lg border border-${colors[i]}-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center`}
                >
                  <div className="relative">
                    <div className={`text-4xl mb-2 text-${colors[i]}-600 drop-shadow-md`}>{icons[i]}</div>
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-md">
                        {badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{labels[i]}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-xl rounded-t-2xl z-50">
        <nav className="flex justify-around items-center py-2">
          <Link href="/admin" className="flex flex-col items-center text-gray-700 hover:text-purple-600 text-sm">
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-0.5">Home</span>
          </Link>
          <Link href="/admin/packages" className="flex flex-col	items-center text-gray-700 hover:text-blue-600 text-sm">
            <span className="text-xl">📦</span>
            <span className="text-xs mt-0.5">Packages</span>
          </Link>
          <Link href="/admin/withdrawals" className="flex flex-col	items-center text-gray-700 hover:text-green-600 text-sm">
            <span className="text-xl">💰</span>
            <span className="text-xs mt-0.5">Withdraw</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col	items-center text-gray-700 hover:text-indigo-600 text-sm">
            <span className="text-xl">👥</span>
            <span className="text-xs mt-0.5">Users</span>
          </Link>
        </nav>
      </footer>
    </div>
  )
}
