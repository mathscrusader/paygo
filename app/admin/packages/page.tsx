// app/admin/packages/page.tsx
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import DeletePackageButton from "@/components/DeletePackageButton"
import UpgradeTransactionsTable from "@/components/UpgradeTransactionsTable"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

type RawPackage = {
  id: number
  key: string
  name: string
  price: number
  createdat: string
}
type Package = {
  id: number
  key: string
  name: string
  price: number
  createdAt: string
}

type TxRow = {
  id: string
  number: string
  amount: number
  status: string
  approved: boolean
  createdAt: string
  evidenceUrl: string | null
  userId: string | null
  bankId: string | null
  type: string
}

async function fetchPackages(): Promise<Package[]> {
  const { data, error } = await supabaseAdmin
    .from<RawPackage>("UpgradeLevel")
    .select("id, key, name, price, createdat")
    .order("createdat", { ascending: false })
  if (error) throw error

  return (data || []).map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    price: p.price,
    createdAt: p.createdat,
  }))
}

async function fetchUpgradeTransactions() {
  const { data: txs, error } = await supabaseAdmin
    .from<TxRow>("Transaction")
    .select(
      'id, number, amount, "createdAt", status, approved, "evidenceUrl", "userId", "bankId", type'
    )
    .eq("type", "upgrade")
    .order("createdAt", { ascending: false })

  if (error) throw error
  const transactions = txs || []

  const userIds = Array.from(
    new Set(transactions.map((t) => t.userId).filter(Boolean))
  ) as string[]

  let userMap: Record<string, { full_name: string | null }> = {}
  if (userIds.length) {
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)
    if (pErr) throw pErr
    if (profiles) {
      userMap = Object.fromEntries(
        profiles.map((p: any) => [p.id, { full_name: p.full_name }])
      )
    }
  }

  return transactions.map((t) => ({
    ...t,
    user: t.userId ? userMap[t.userId] : undefined,
  }))
}

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams?: { view?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/auth/signin")
  }

  const view = searchParams?.view === "packages" ? "packages" : "upgrades"

  let packages: Package[] = []
  let upgradeTx: any[] = []

  try {
    if (view === "packages") {
      packages = await fetchPackages()
    } else {
      upgradeTx = await fetchUpgradeTransactions()
    }
  } catch (e: any) {
    console.error("Error loading data:", e)
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 mb-4">
        Failed to load: {e.message}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16">
      {/* Header */}
      <header className="bg-[#34296B] text-white p-4 shadow-sm">
        <div className="container mx-auto flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm opacity-80">
              {view === "packages" ? "Package Management" : "Upgrade Transactions"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {view === "packages" ? (
              <Link
                href="/admin/packages"
                className="px-4 py-2 bg-white text-[#34296B] rounded-lg font-medium hover:bg-opacity-90 transition-all text-sm flex items-center gap-1"
              >
                ← Upgrade Payments
              </Link>
            ) : (
              <Link
                href="/admin/packages?view=packages"
                className="px-4 py-2 bg-white text-[#34296B] rounded-lg font-medium hover:bg-opacity-90 transition-all text-sm"
              >
                List Packages
              </Link>
            )}
            <Link
              href="/admin/packages/new"
              className="px-4 py-2 bg-[#00B74F] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all text-sm flex items-center gap-1"
            >
              + Add Package
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-4">
        <div className="flex border-b border-gray-200">
          <Link
            href="/admin/packages?view=packages"
            className={`px-4 py-2 font-medium text-sm ${
              view === "packages"
                ? "text-[#34296B] border-b-2 border-[#34296B]"
                : "text-gray-500 hover:text-[#34296B]"
            }`}
          >
            Packages
          </Link>
          <Link
            href="/admin/packages"
            className={`px-4 py-2 font-medium text-sm ${
              view !== "packages"
                ? "text-[#34296B] border-b-2 border-[#34296B]"
                : "text-gray-500 hover:text-[#34296B]"
            }`}
          >
            Upgrade Transactions
          </Link>
        </div>
      </div>

      {/* Main (mobile card style everywhere) */}
      <main className="container mx-auto p-4 mt-2">
        {view === "packages" ? (
          <div className="space-y-3">
            {packages.length === 0 && (
              <div className="bg-white rounded-lg p-6 text-center text-gray-500">
                No packages found
              </div>
            )}
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#34296B] text-base">
                      {pkg.name}
                    </h3>
                    <p className="text-xs font-mono text-[#6C63FF] mt-1">
                      {pkg.key}
                    </p>
                  </div>
                  <span className="font-bold text-lg">
                    ₦{pkg.price.toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Created:{" "}
                    {new Date(pkg.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/packages/edit/${pkg.id}`}
                      className="px-3 py-1 bg-[#34296B] text-white text-xs rounded hover:bg-opacity-90 transition-all flex items-center"
                    >
                      Edit
                    </Link>
                    <DeletePackageButton
                      id={pkg.id}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-opacity-90 transition-all flex items-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // The component already has mobile cards;
          // ensure it's mobile-only by editing that component (removed desktop table).
          <UpgradeTransactionsTable initialTx={upgradeTx} />
        )}
      </main>

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