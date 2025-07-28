// app/promotions/page.tsx

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"

interface Promotion {
  slug: string
  title: string
  description: string | null
  image_url: string | null
}

export default async function PromotionsIndexPage() {
  const { data: promotions, error } = await supabase
    .from<Promotion>("promotions")
    .select("slug,title,description,image_url")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error loading promotions:", error)
    return notFound()
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-12">
      {/* OPAY‑style Gradient Header */}
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-5 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center">
          <Link
            href="/"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-transform hover:-rotate-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="ml-4 text-2xl font-bold">Promotions</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-6">
        {promotions && promotions.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <Link
                key={promo.slug}
                href={`/promotions/${promo.slug}`}
                className="block bg-white rounded-xl overflow-hidden shadow transform hover:scale-105 hover:shadow-lg transition duration-300 ease-in-out"
              >
                {promo.image_url && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={promo.image_url}
                      alt={promo.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-[#34296B]">
                    {promo.title}
                  </h2>
                  {promo.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {promo.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-12">
            No promotions available.
          </p>
        )}
      </main>
    </div>
  )
}
