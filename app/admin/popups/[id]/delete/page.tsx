// app/admin/popups/[id]/delete/page.tsx
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { ArrowLeft } from "lucide-react"

interface Params { params: { id: string } }

export default async function DeletePopupPage({ params }: Params) {
  const { id } = params

  // Fetch existing popup
  const { data: popup, error } = await supabaseAdmin
    .from("popups")
    .select("title, message, start_at, end_at")
    .eq("id", id)
    .maybeSingle()

  if (error || !popup) {
    console.error("Error loading popup:", error)
    return notFound()
  }

  // Server action to delete popup
  async function deletePopup() {
    'use server'
    const { error: delErr } = await supabaseAdmin
      .from("popups")
      .delete()
      .eq("id", id)

    if (delErr) console.error("Error deleting popup:", delErr)
    redirect("/admin/popups")
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-12">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-5 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center">
          <Link
            href="/admin/popups"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-transform hover:-rotate-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="ml-4 text-2xl font-bold">Delete Popup</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-3xl">
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-[#34296B]">Are you sure you want to delete this popup?</h2>
          <div className="space-y-2">
            <p><strong>Title:</strong> {popup.title}</p>
            <p><strong>Message:</strong> {popup.message}</p>
            <p><strong>Start At:</strong> {new Date(popup.start_at).toLocaleString()}</p>
            <p><strong>End At:</strong> {new Date(popup.end_at).toLocaleString()}</p>
          </div>
          <form action={deletePopup} className="flex justify-end space-x-4 pt-4 border-t border-[#e0e4ff]">
            <Link
              href="/admin/popups"
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"
            >
              Delete Popup
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
