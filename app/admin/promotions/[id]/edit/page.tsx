// app/admin/promotions/[id]/edit/page.tsx

import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { ArrowLeft } from "lucide-react"

interface Params {
  params: { id: string }
}

export default async function EditPromotionPage({ params }: Params) {
  const { id } = params

  // Fetch the existing promotion
  const { data: promo, error } = await supabaseAdmin
    .from("promotions")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !promo) {
    console.error("Error loading promotion:", error)
    return notFound()
  }

  // Server‑action to update the promotion
  async function updatePromotion(formData: FormData) {
    "use server"
    const title       = formData.get("title")?.toString()       || ""
    const slug        = formData.get("slug")?.toString()        || ""
    const description = formData.get("description")?.toString() || ""
    const image_url   = formData.get("image_url")?.toString()   || ""
    const link_url    = formData.get("link_url")?.toString()    || ""
    const content     = formData.get("content")?.toString()     || ""
    const start_date  = formData.get("start_date")?.toString()  || null
    const end_date    = formData.get("end_date")?.toString()    || null
    const is_active   = formData.get("is_active") === "on"

    const { error } = await supabaseAdmin
      .from("promotions")
      .update({
        title,
        slug,
        description,
        image_url,
        link_url,
        content,
        start_date: start_date || undefined,
        end_date:   end_date   || undefined,
        is_active,
      })
      .eq("id", id)

    if (error) console.error("Error updating promotion:", error)
    redirect("/admin/promotions")
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-12">
      {/* OPAY‑style Gradient Header */}
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-5 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center space-x-4">
          <Link
            href="/admin/promotions"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-transform hover:-rotate-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Promotion</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-3xl">
        <form
          action={updatePromotion}
          className="bg-white rounded-xl shadow-md p-6 space-y-6"
        >
          {/* Title & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block mb-1 text-sm font-medium text-[#34296B]">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                defaultValue={promo.title}
                required
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
            <div>
              <label htmlFor="slug" className="block mb-1 text-sm font-medium text-[#34296B]">
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={promo.slug}
                required
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block mb-1 text-sm font-medium text-[#34296B]">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={promo.description || ""}
              className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
            />
          </div>

          {/* Image & Link URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="image_url" className="block mb-1 text-sm font-medium text-[#34296B]">
                Image URL
              </label>
              <input
                id="image_url"
                name="image_url"
                type="text"
                defaultValue={promo.image_url || ""}
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
            <div>
              <label htmlFor="link_url" className="block mb-1 text-sm font-medium text-[#34296B]">
                Link URL
              </label>
              <input
                id="link_url"
                name="link_url"
                type="text"
                defaultValue={promo.link_url || ""}
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block mb-1 text-sm font-medium text-[#34296B]">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              rows={4}
              defaultValue={promo.content || ""}
              className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block mb-1 text-sm font-medium text-[#34296B]">
                Start Date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={promo.start_date?.slice(0, 10) || ""}
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block mb-1 text-sm font-medium text-[#34296B]">
                End Date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={promo.end_date?.slice(0, 10) || ""}
                className="w-full border border-[#e0e4ff] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B3A8C]"
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={promo.is_active}
              className="mr-2 w-4 h-4 text-[#4B3A8C] border border-[#e0e4ff] rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-[#34296B]">
              Active
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-[#e0e4ff]">
            <Link
              href="/admin/promotions"
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white rounded-lg hover:opacity-90 transition"
            >
              Update Promotion
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
