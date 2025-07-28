// app/admin/popups/[id]/edit/page.tsx
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { ArrowLeft } from "lucide-react"

interface Params { params: { id: string } }

export default async function EditPopupPage({ params }: Params) {
  const { id } = params

  // Fetch existing popup
  const { data: popup, error } = await supabaseAdmin
    .from("popups")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !popup) {
    console.error("Error loading popup:", error)
    return notFound()
  }

  // Server action to update popup
  async function updatePopup(formData: FormData) {
    'use server'

    const title    = formData.get("title")?.toString() || ""
    const message  = formData.get("message")?.toString() || ""
    const duration = Number(formData.get("duration")?.toString()) || 2
    const maxPer   = Number(formData.get("maxPer")?.toString()) || 1
    const start_at = formData.get("start_at")?.toString() || ""
    const end_at   = formData.get("end_at")?.toString() || ""

    const { error: updateErr } = await supabaseAdmin
      .from("popups")
      .update({
        title,
        message,
        duration_minutes:      duration,
        max_displays_per_user: maxPer,
        start_at,
        end_at
      })
      .eq("id", id)

    if (updateErr) console.error("Error updating popup:", updateErr)
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
          <h1 className="ml-4 text-2xl font-bold">Edit Popup</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-3xl">
        <form action={updatePopup} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block mb-1 text-sm font-medium text-[#34296B]">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={popup.title}
              required
              className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block mb-1 text-sm font-medium text-[#34296B]">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              defaultValue={popup.message}
              required
              className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
            />
          </div>

          {/* Duration & Max per user */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block mb-1 text-sm font-medium text-[#34296B]">
                Duration (minutes)
              </label>
              <input
                id="duration"
                name="duration"
                type="number"
                defaultValue={popup.duration_minutes}
                min={1}
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
            <div>
              <label htmlFor="maxPer" className="block mb-1 text-sm font-medium text-[#34296B]">
                Max displays/user
              </label>
              <input
                id="maxPer"
                name="maxPer"
                type="number"
                defaultValue={popup.max_displays_per_user}
                min={1}
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
          </div>

          {/* Start & End */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_at" className="block mb-1 text-sm font-medium text-[#34296B]">
                Start At
              </label>
              <input
                id="start_at"
                name="start_at"
                type="datetime-local"
                defaultValue={popup.start_at?.slice(0, 16)}
                required
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
            <div>
              <label htmlFor="end_at" className="block mb-1 text-sm font-medium text-[#34296B]">
                End At
              </label>
              <input
                id="end_at"
                name="end_at"
                type="datetime-local"
                defaultValue={popup.end_at?.slice(0, 16)}
                required
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-[#e0e4ff]">
            <Link
              href="/admin/popups"
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white rounded-lg hover:opacity-90 transition"
            >
              Update Popup
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
