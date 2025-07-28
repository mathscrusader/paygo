// app/promotions/[slug]/page.tsx
import React from 'react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
    .from<Promotion>('promotions')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !promo) {
    // if not found, show Next.js 404
    return notFound()
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Title */}
      <h1 className="text-4xl font-bold mb-4">{promo.title}</h1>

      {/* Date Range */}
      {(promo.start_date || promo.end_date) && (
        <p className="text-sm text-gray-500 mb-6">
          {promo.start_date && new Date(promo.start_date).toLocaleDateString()}
          {' '}
          {promo.start_date && promo.end_date && '–'}
          {' '}
          {promo.end_date && new Date(promo.end_date).toLocaleDateString()}
        </p>
      )}

      {/* Featured Image */}
      {promo.image_url && (
        <div className="mb-6">
          <Image
            src={promo.image_url}
            alt={promo.title}
            width={800}
            height={450}
            className="w-full h-auto rounded-lg"
          />
        </div>
      )}

      {/* Short Description */}
      {promo.description && (
        <p className="text-lg text-gray-700 mb-6">{promo.description}</p>
      )}

      {/* Full Content */}
      {promo.content ? (
        <div
          className="prose prose-lg"
          dangerouslySetInnerHTML={{ __html: promo.content }}
        />
      ) : (
        <p className="text-gray-600">No additional details provided.</p>
      )}
    </div>
  )
}
