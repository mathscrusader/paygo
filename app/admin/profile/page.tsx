// app/admin/profile/page.tsx
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import Link from "next/link"

export default async function ProfilePage() {
  // 1. Only require session (no role check)
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/auth/signin")
  }
  const userId = session.user.id

  // 2. Fetch Auth‑side User record
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("User")
    .select("id, email, name, role, createdAt, payId")
    .eq("id", userId)
    .maybeSingle()

  // 3. Fetch profiles record
  const { data: profileRow, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("full_name, country_code, email, upgrade_level_id, referral_code, referred_by, reward_balance, is_admin, created_at")
    .eq("id", userId)
    .maybeSingle()

  if (userErr || profileErr || !userRow || !profileRow) {
    // Could render an error UI or redirect
    redirect("/")
  }

  return (
    <div className="max-w-2xl mx-auto my-12 p-6 bg-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Profile</h1>

      <div className="space-y-4">
        {/* Auth table fields */}
        <div>
          <span className="font-medium">User ID:</span>
          <div className="text-gray-700">{userRow.id}</div>
        </div>
        <div>
          <span className="font-medium">Email:</span>
          <div className="text-gray-700">{userRow.email}</div>
        </div>
        <div>
          <span className="font-medium">Name:</span>
          <div className="text-gray-700">{userRow.name || "—"}</div>
        </div>
        <div>
          <span className="font-medium">Role:</span>
          <div className="text-gray-700">{userRow.role}</div>
        </div>
        <div>
          <span className="font-medium">Registered At:</span>
          <div className="text-gray-700">
            {new Date(userRow.createdAt).toLocaleString()}
          </div>
        </div>
        <div>
          <span className="font-medium">PAY ID:</span>
          <div className="text-gray-700">{userRow.payId || "None"}</div>
        </div>

        <hr className="my-4" />

        {/* profiles table fields */}
        <div>
          <span className="font-medium">Full Name:</span>
          <div className="text-gray-700">{profileRow.full_name}</div>
        </div>
        <div>
          <span className="font-medium">Country Code:</span>
          <div className="text-gray-700">{profileRow.country_code}</div>
        </div>
        <div>
          <span className="font-medium">Profile Email:</span>
          <div className="text-gray-700">{profileRow.email || "—"}</div>
        </div>
        <div>
          <span className="font-medium">Joined On:</span>
          <div className="text-gray-700">
            {new Date(profileRow.created_at).toLocaleDateString()}
          </div>
        </div>
        <div>
          <span className="font-medium">Upgrade Level ID:</span>
          <div className="text-gray-700">{profileRow.upgrade_level_id || "None"}</div>
        </div>
        <div>
          <span className="font-medium">Referral Code:</span>
          <div className="text-gray-700">{profileRow.referral_code || "N/A"}</div>
        </div>
        <div>
          <span className="font-medium">Referred By:</span>
          <div className="text-gray-700">{profileRow.referred_by || "N/A"}</div>
        </div>
        <div>
          <span className="font-medium">Reward Balance:</span>
          <div className="text-gray-700">
            ₦{profileRow.reward_balance?.toLocaleString() ?? 0}
          </div>
        </div>
        <div>
          <span className="font-medium">Is Admin Flag:</span>
          <div className="text-gray-700">{profileRow.is_admin ? "Yes" : "No"}</div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          Back
        </Link>
      </div>
    </div>
  )
}
