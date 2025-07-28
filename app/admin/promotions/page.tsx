// app/admin/promotions/page.tsx

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function PromotionsPage() {
  const { data: promotions, error } = await supabaseAdmin
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching promotions:", error)
    return <p className="p-6 text-red-600">Error loading promotions.</p>
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-12">
      {/* Header with purple gradient and back arrow */}
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-5 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center space-x-4">
          <Link 
            href="/admin" 
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:rotate-[-5deg]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Manage Promotions</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#34296B]">Current Promotions</h2>
          <Link
            href="/admin/promotions/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <span>+ Add Promotion</span>
          </Link>
        </div>

        {(!promotions || promotions.length === 0) ? (
          <div className="bg-white rounded-xl p-6 text-center border border-[#e0e4ff]">
            <p className="text-gray-500">No promotions found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-[#e0e4ff] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f0f2ff]">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-[#4B3A8C]">Title</th>
                    <th className="p-3 text-left text-xs font-semibold text-[#4B3A8C]">Slug</th>
                    <th className="p-3 text-center text-xs font-semibold text-[#4B3A8C]">Status</th>
                    <th className="p-3 text-center text-xs font-semibold text-[#4B3A8C]">Start Date</th>
                    <th className="p-3 text-center text-xs font-semibold text-[#4B3A8C]">End Date</th>
                    <th className="p-3 text-center text-xs font-semibold text-[#4B3A8C]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promo) => (
                    <tr key={promo.id} className="border-t border-[#e0e4ff] hover:bg-[#f8f9ff] transition-colors">
                      <td className="p-3 text-sm font-medium text-[#34296B]">{promo.title}</td>
                      <td className="p-3 text-sm text-[#6B7280]">{promo.slug}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          promo.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {promo.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-center text-[#6B7280]">
                        {promo.start_date?.slice(0, 10) || "-"}
                      </td>
                      <td className="p-3 text-sm text-center text-[#6B7280]">
                        {promo.end_date?.slice(0, 10) || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/admin/promotions/${promo.id}/edit`}
                            className="px-3 py-1 bg-[#e0e4ff] text-[#34296B] rounded-lg text-sm hover:bg-[#d0d4ff] transition-all"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/promotions/${promo.id}/delete`}
                            className="px-3 py-1 bg-[#ffebee] text-[#d32f2f] rounded-lg text-sm hover:bg-[#ffcdd2] transition-all"
                          >
                            Delete
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
