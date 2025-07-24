// app/admin/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import PendingTransactions from "@/components/PendingTransactions";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function AdminPage() {
  // Auth protect
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/auth/signin");
  }

  // ---------- Pending list ----------
  let transactions: any[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("Transaction")
      .select(
        `
        id,
        userId,
        number,
        amount,
        status,
        approved,
        createdAt,
        type,
        referenceId,
        evidenceUrl,
        bankId,
        meta,
        email:meta->>email,
        full_name:meta->>fullName
      `
      )
      .eq("approved", false)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    transactions = data ?? [];
  } catch (e: any) {
    console.error("Error loading pending transactions:", e);
    return (
      <div className="p-4 bg-red-500/10 text-red-600 rounded-xl mx-4 my-2 backdrop-blur-sm border border-red-500/20 shadow-lg">
        Failed to load transactions: {e.message}
      </div>
    );
  }

  // ---------- Stats ----------
  // Head-only counts
  const [totalTxRes, pendingTxRes, approvedTxRes] = await Promise.all([
    supabaseAdmin.from("Transaction").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("Transaction")
      .select("id", { count: "exact", head: true })
      .eq("approved", false),
    supabaseAdmin
      .from("Transaction")
      .select("id", { count: "exact", head: true })
      .eq("approved", true),
  ]);

  const totalTransactions = totalTxRes.count ?? 0;
  const pendingCount = pendingTxRes.count ?? 0;
  const approvedCount = approvedTxRes.count ?? 0;

  // Today
  let todayCount = 0;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabaseAdmin
      .from("Transaction")
      .select("id", { count: "exact", head: true })
      .gte("createdAt", startOfDay.toISOString());
    if (error) throw error;
    todayCount = count ?? 0;
  } catch (e: any) {
    console.error("Error counting today's transactions:", e);
  }

  // Aggregation in JS
  const { data: aggRows, error: aggErr } = await supabaseAdmin
    .from("Transaction")
    .select("amount, status, approved, type");
  if (aggErr) console.error("Aggregation fetch error:", aggErr);

  let sumPending = 0;
  let sumApproved = 0;
  const byType: Record<string, { count: number; total: number }> = {};

  if (aggRows) {
    for (const r of aggRows) {
      const status = (r.status || "").toLowerCase();
      if (status === "pending") sumPending += r.amount ?? 0;
      if (r.approved) sumApproved += r.amount ?? 0;

      const t = r.type ?? "unknown";
      if (!byType[t]) byType[t] = { count: 0, total: 0 };
      byType[t].count += 1;
      byType[t].total += r.amount ?? 0;
    }
  }

  // Users
  let totalUsers = 0;
  try {
    const { count, error } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    totalUsers = count ?? 0;
  } catch (e: any) {
    console.error("Error counting users:", e);
  }

  const approvalRate = totalTransactions
    ? Math.round((approvedCount / totalTransactions) * 100)
    : 0;

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
            <Link href="/admin/notifications" className="relative group">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-xl">🔔</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-md">
                  3
                </span>
              </div>
            </Link>
            <span className="px-3 py-1 text-xs font-bold bg-white/20 text-white rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
              ADMIN
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="p-4 max-w-6xl mx-auto">
        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Pending */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-purple-500 transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{pendingCount}</p>
              </div>
              <div className="text-purple-600 text-2xl">⏱️</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ₦{sumPending.toLocaleString()} pending
            </p>
          </div>

          {/* Today's Txns */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-blue-500 transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Today's Txns</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{todayCount}</p>
              </div>
              <div className="text-blue-600 text-2xl">💰</div>
            </div>
          </div>

          {/* Total Txns */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-indigo-500 transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Txns</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalTransactions}</p>
              </div>
              <div className="text-indigo-600 text-2xl">🧾</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ₦{sumApproved.toLocaleString()} approved
            </p>
          </div>

          {/* Approval Rate */}
          <div className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-yellow-500 transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{approvalRate}%</p>
              </div>
              <div className="text-yellow-600 text-2xl">📊</div>
            </div>
          </div>
        </div>

        {/* By Type */}
        {Object.keys(byType).length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4 ml-1">
              Transactions by Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Object.entries(byType).map(([t, v]) => (
                <div
                  key={t}
                  className="bg-white/90 p-4 rounded-2xl shadow-2xl border-t-4 border-gray-300 transform hover:-translate-y-1 transition-transform"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium capitalize">
                        {t} Txns
                      </p>
                      <p className="text-xl font-bold text-gray-800 mt-1">{v.count}</p>
                      <p className="text-xs text-gray-500">
                        ₦{v.total.toLocaleString()}
                      </p>
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
            <Link
              href="/admin/payid"
              className="bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-2xl shadow-lg border border-purple-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-purple-600 drop-shadow-md">🆔</div>
              <span className="text-sm font-medium text-gray-700">PAY IDs</span>
            </Link>
            <Link
              href="/admin/packages"
              className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-2xl shadow-lg border border-blue-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-blue-600 drop-shadow-md">📦</div>
              <span className="text-sm font-medium text-gray-700">Packages</span>
            </Link>
            <Link
              href="/admin/transactions"
              className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-2xl shadow-lg border border-green-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-green-600 drop-shadow-md">💰</div>
              <span className="text-sm font-medium text-gray-700">Transactions</span>
            </Link>
            <Link
              href="/admin/history"
              className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-4 rounded-2xl shadow-lg border border-yellow-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-yellow-600 drop-shadow-md">🕒</div>
              <span className="text-sm font-medium text-gray-700">History</span>
            </Link>
            <Link
              href="/admin/earn"
              className="bg-gradient-to-br from-red-100 to-red-50 p-4 rounded-2xl shadow-lg border border-red-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-red-600 drop-shadow-md">💸</div>
              <span className="text-sm font-medium text-gray-700">Earn</span>
            </Link>
            <Link
              href="/admin/users"
              className="bg-gradient-to-br from-indigo-100 to-indigo-50 p-4 rounded-2xl shadow-lg border border-indigo-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-indigo-600 drop-shadow-md">👥</div>
              <span className="text-sm font-medium text-gray-700">Users</span>
            </Link>
            <Link
              href="/admin/banks"
              className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-4 rounded-2xl shadow-lg border border-cyan-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-cyan-600 drop-shadow-md">🏦</div>
              <span className="text-sm font-medium text-gray-700">Banks</span>
            </Link>
            <Link
              href="/admin/currency"
              className="bg-gradient-to-br from-orange-100 to-orange-50 p-4 rounded-2xl shadow-lg border border-orange-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-orange-600 drop-shadow-md">💱</div>
              <span className="text-sm font-medium text-gray-700">Currency</span>
            </Link>
            <Link
              href="/admin/promotion"
              className="bg-gradient-to-br from-pink-100 to-pink-50 p-4 rounded-2xl shadow-lg border border-pink-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-2 text-pink-600 drop-shadow-md">🎁</div>
              <span className="text-sm font-medium text-gray-700">Promotion</span>
            </Link>
          </div>
        </div>

        {/* Pending Transactions Table */}
        <div className="bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
          <div className="px-5 py-4 border-b border-gray-200/50 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Pending Transactions</h2>
                <p className="text-xs text-gray-500">{pendingCount} awaiting approval</p>
              </div>
              <Link
                href="/admin/history"
                className="text-purple-600 text-sm font-medium hover:underline"
              >
                View All →
              </Link>
            </div>
          </div>
          <PendingTransactions initialTransactions={transactions} />
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-4 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 flex justify-around p-2">
        <Link
          href="/admin"
          className="flex flex-col items-center p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
        >
          <span className="text-2xl">📊</span>
          <span className="text-xs mt-1 font-medium">Dashboard</span>
        </Link>
        <Link
          href="/admin/transactions"
          className="flex flex-col items-center p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
        >
          <span className="text-2xl">💳</span>
          <span className="text-xs mt-1 font-medium">Transactions</span>
        </Link>
        <Link
          href="/admin/history"
          className="flex flex-col items-center p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
        >
          <span className="text-2xl">🕒</span>
          <span className="text-xs mt-1 font-medium">History</span>
        </Link>
        <Link
          href="/admin/earn"
          className="flex flex-col items-center p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
        >
          <span className="text-2xl">💸</span>
          <span className="text-xs mt-1 font-medium">Earn</span>
        </Link>
      </nav>
    </div>
  );
}
