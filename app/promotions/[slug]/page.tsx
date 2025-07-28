// app/promotions/[slug]/page.tsx

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"

interface Promotion {
  id: string
  title: string
  slug: string
  description: string | null
  image_url: string | null
  content: string | null
  start_date: string | null
  end_date: string | null
}

interface Props {
  params: { slug: string }
}

export default async function PromotionDetailPage({ params }: Props) {
  const { slug } = params

  // fetch the promotion by slug
  const { data: promo, error } = await supabase
    .from<Promotion>("promotions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error || !promo) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-12">
      {/* OPAY‑style Gradient Header */}
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-5 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center space-x-4">
          <Link
            href="/promotions"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-transform hover:-rotate-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Promotion Details</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-3xl space-y-6">
        {/* Title */}
        <h2 className="text-3xl font-bold text-[#34296B]">{promo.title}</h2>

        {/* Date Range */}
        {(promo.start_date || promo.end_date) && (
          <p className="text-sm text-gray-500">
            {promo.start_date && new Date(promo.start_date).toLocaleDateString()}{" "}
            {promo.start_date && promo.end_date && "–"}{" "}
            {promo.end_date && new Date(promo.end_date).toLocaleDateString()}
          </p>
        )}

        {/* Featured Image */}
        {promo.image_url && (
          <div className="rounded-xl overflow-hidden shadow-md">
            <Image
              src={promo.image_url}
              alt={promo.title}
              width={800}
              height={450}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Short Description */}
        {promo.description && (
          <p className="text-lg text-gray-700">{promo.description}</p>
        )}

        {/* Full Content */}
        {promo.content ? (
          <div
            className="bg-white rounded-xl shadow p-6 prose prose-lg"
            dangerouslySetInnerHTML={{ __html: promo.content }}
          />
        ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600">No additional details provided.</p>
          </div>
        )}
      </main>
    </div>
  )
}
