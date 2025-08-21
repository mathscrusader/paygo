// app/admin/promotions/[id]/delete/page.tsx
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { ArrowLeft } from "lucide-react"

interface Params { params: { id: string } }

export default async function DeletePromotionPage({ params }: Params) {
  const { id } = params

  // Fetch existing promotion
  const { data: promo, error } = await supabaseAdmin
    .from("promotions")
    .select("title, description")
    .eq("id", id)
    .maybeSingle()

  if (error || !promo) {
    console.error("Error loading promotion:", error)
    return notFound()
  }

  // Server action to delete promotion
  async function deletePromotion() {
    "use server"
    const { error: delErr } = await supabaseAdmin
      .from("promotions")
      .delete()
      .eq("id", id)

    if (delErr) console.error("Error deleting promotion:", delErr)
    redirect("/admin/promotions")
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-5 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center space-x-4">
          <Link 
            href="/admin/promotions" 
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:rotate-[-5deg]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Delete Promotion</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-[#34296B] mb-4">Confirm Deletion</h2>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Are you sure you want to delete this promotion?</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-1">{promo.title}</h3>
              <p className="text-sm text-red-600">{promo.description}</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            This action cannot be undone. The promotion will be permanently removed from the system.
          </p>

          <form action={deletePromotion}>
            <div className="flex justify-end gap-4">
              <Link
                href="/admin/promotions"
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"
              >
                Delete Promotion
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}