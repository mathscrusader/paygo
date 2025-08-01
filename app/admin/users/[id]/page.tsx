// app/admin/users/[id]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, User, Mail, Globe, Award, Gift, Users, CreditCard, Calendar } from "lucide-react"
import type { ReactNode } from "react"

interface PageProps {
  params: { id: string }
}

export default async function UserDetailsPage({ params }: PageProps) {
  const id = params.id

  const { data: user, error } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "full_name",
        "email",
        "country_code",
        "created_at",
        "upgrade_level_id",
        "referral_code",
        "referred_by",
        "reward_balance",
        "is_admin"
      ].join(", ")
    )
    .eq("id", id)
    .single()

  if (error || !user) {
    console.error("Fetch profiles error:", error)
    return notFound()
  }

  return (
    <div className="min-h-screen bg-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 text-purple-700 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Users</span>
          </Link>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.is_admin 
              ? "bg-purple-100 text-purple-800 border border-purple-200" 
              : "bg-white text-purple-700 border border-purple-200"
          }`}>
            {user.is_admin ? "Admin" : "User"}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-purple-100">
          <div className="bg-purple-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-purple-700 text-2xl font-bold shadow-md">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-purple-200" />
                  <span className="text-purple-200">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <DetailCard 
                icon={<User className="w-5 h-5 text-purple-600" />}
                label="User ID"
                value={user.id}
              />
              <DetailCard 
                icon={<Calendar className="w-5 h-5 text-purple-600" />}
                label="Joined Date"
                value={new Date(user.created_at).toLocaleDateString()}
              />
              <DetailCard 
                icon={<Globe className="w-5 h-5 text-purple-600" />}
                label="Country Code"
                value={user.country_code || "—"}
              />
              <DetailCard 
                icon={<Award className="w-5 h-5 text-purple-600" />}
                label="Upgrade Level"
                value={user.upgrade_level_id ? `Level ${user.upgrade_level_id}` : "Basic"}
              />
            </div>

            <div className="border-t border-purple-100 pt-4">
              <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <DetailCard 
                  icon={<CreditCard className="w-5 h-5 text-green-600" />}
                  label="Reward Balance"
                  value={
                    <span className="text-green-600">
                      ₦{user.reward_balance?.toLocaleString() ?? "0"}
                    </span>
                  }
                  highlight
                />
              </div>
            </div>

            <div className="border-t border-purple-100 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Referral Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailCard 
                  icon={<Gift className="w-5 h-5 text-purple-600" />}
                  label="Referral Code"
                  value={user.referral_code || "—"}
                />
                <DetailCard 
                  icon={<Users className="w-5 h-5 text-purple-600" />}
                  label="Referred By"
                  value={user.referred_by || "—"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DetailCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  highlight?: boolean
}

function DetailCard({ label, value, icon, highlight = false }: DetailCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
      <div className="bg-white p-2 rounded-lg shadow-sm text-purple-700">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">{label}</p>
        <p className={`mt-1 ${highlight ? "text-purple-800 font-bold text-lg" : "text-purple-900 font-medium"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
