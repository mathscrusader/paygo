// app/profile/[id]/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { notFound } from "next/navigation"

interface UserRow {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  payId: string | null
}

interface ProfileRow {
  full_name: string
  country_code: string
  email: string | null
  upgrade_level_id: string | null
  referral_code: string | null
  referred_by: string | null
  reward_balance: number | null
  is_admin: boolean | null
  created_at: string
}

export default async function PublicProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const userId = params.id

  // Fetch from Auth-side User table
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from<UserRow>("User")
    .select("id, email, name, role, createdAt, payId")
    .eq("id", userId)
    .maybeSingle()

  // Fetch from profiles table
  const { data: profileRow, error: profileErr } = await supabaseAdmin
    .from<ProfileRow>("profiles")
    .select(
      "full_name, country_code, email, upgrade_level_id, referral_code, referred_by, reward_balance, is_admin, created_at"
    )
    .eq("id", userId)
    .maybeSingle()

  if (userErr || profileErr || !userRow || !profileRow) {
    return notFound()
  }

  return (
    <div className="max-w-2xl mx-auto my-12 p-6 bg-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {profileRow.full_name}'s Profile
      </h1>

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
    </div>
  )
}
