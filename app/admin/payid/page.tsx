// app/admin/payid/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  BarChart2,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PayIdTable from "./PayIdTable";

// ---------- SERVER ACTIONS ----------
async function approveTxn(id: string) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/auth/signin");

  const { error } = await supabaseAdmin
    .from("Transaction")
    .update({ approved: true, status: "APPROVED" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/payid");
  return { success: true, message: "Transaction approved successfully!" };
}

async function declineTxn(id: string) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/auth/signin");

  const { error } = await supabaseAdmin
    .from("Transaction")
    .update({ approved: false, status: "REJECTED" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/payid");
  return { success: true, message: "Transaction rejected successfully!" };
}

// ---------- TYPES ----------
type Row = {
  id: string;
  number: string;
  amount: number;
  status: string;
  approved: boolean;
  createdAt: string;
  evidenceUrl: string | null;
  signedEvidenceUrl?: string | null;
  referenceId: string | null;
  email?: string;
  full_name?: string;
  meta: any;
};

// ---------- HELPERS ----------
function extractBucketAndPath(raw: string) {
  // Matches .../object/public/<bucket>/<path> or /object/sign/...
  const m = raw.match(/\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
  if (m) return { bucket: m[1], path: m[2] };
  return { bucket: "payment-evidence", path: raw.replace(/^\/+/, "") };
}

async function signIfNeeded(url: string | null) {
  if (!url) return null;

  // Try to sign always, to avoid "bucket not found" on public/private mismatch
  const { bucket, path } = extractBucketAndPath(url);
  const { data, error } = await supabaseAdmin
    .storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error("sign error", error, "bucket:", bucket, "path:", path);
    // fallback to original (may still work if public)
    return url;
  }
  return data.signedUrl;
}

// ---------- PAGE ----------
export default async function PayIdsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/auth/signin");

  // Fetch only activation transactions
  const { data: txns, error } = await supabaseAdmin
    .from("Transaction")
    .select(`
      id,
      number,
      amount,
      status,
      approved,
      createdAt,
      type,
      referenceId,
      evidenceUrl,
      meta,
      email:meta->>email,
      full_name:meta->>fullName
    `)
    .eq("type", "activation")
    .order("createdAt", { ascending: false });

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-xl shadow-sm border border-red-200">
        Failed to load Pay ID transactions: {error.message}
      </div>
    );
  }

  const rows: Row[] = txns ?? [];

  // Sign evidence URLs
  const signedRows = await Promise.all(
    rows.map(async (t) => ({
      ...t,
      signedEvidenceUrl: await signIfNeeded(t.evidenceUrl),
    }))
  );

  // ----- Stats -----
  const total = signedRows.length;
  const pending = signedRows.filter((r) => !r.approved && r.status === "PENDING").length;
  const approved = signedRows.filter((r) => r.approved).length;
  const rejected = signedRows.filter((r) => r.status === "REJECTED").length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaysRevenue = signedRows
    .filter((r) => r.approved && new Date(r.createdAt) >= todayStart)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const totalRevenue = signedRows
    .filter((r) => r.approved)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const pendingValue = signedRows
    .filter((r) => !r.approved && r.status === "PENDING")
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5 sticky top-0 z-50 shadow-2xl border-b-4 border-purple-400/30">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-base sm:text-lg font-bold tracking-wide">Pay ID Requests</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        {/* 6 Cards: 3 columns x 2 rows on mobile */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Total" value={total} icon={<BarChart2 className="h-5 w-5 text-indigo-400" />} border="border-indigo-500" />
          <StatCard label="Pending" value={pending} sub={`₦${pendingValue.toLocaleString()}`} icon={<Clock className="h-5 w-5 text-yellow-400" />} border="border-yellow-500" />
          <StatCard label="Approved" value={approved} icon={<CheckCircle2 className="h-5 w-5 text-green-400" />} border="border-green-500" />
          <StatCard label="Rejected" value={rejected} icon={<XCircle className="h-5 w-5 text-red-400" />} border="border-red-500" />
          <StatCard label="Today's Revenue" value={`₦${todaysRevenue.toLocaleString()}`} icon={<CreditCard className="h-5 w-5 text-blue-400" />} border="border-blue-500" />
          <StatCard label="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} icon={<CreditCard className="h-5 w-5 text-purple-400" />} border="border-purple-500" />
        </div>

        {/* Table */}
        <PayIdTable
          rows={signedRows}
          approveAction={approveTxn}
          declineAction={declineTxn}
        />
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

function StatCard({
  label,
  value,
  icon,
  border,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  border: string;
  sub?: string;
}) {
  return (
    <div className={`bg-white/90 p-3 rounded-2xl shadow-2xl border-t-4 ${border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-500 font-medium leading-none">{label}</p>
          <p className="text-lg font-bold text-gray-800 mt-1 leading-none">{value}</p>
          {sub && <p className="text-[10px] text-gray-500 mt-1 leading-none">{sub}</p>}
        </div>
        {icon}
      </div>
    </div>
  );
}