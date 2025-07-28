'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Promo {
  id: string | number
  image: string
  alt: string
  link?: string
}

interface PromoCarouselProps {
  className?: string
}

// 1) your old hard‑coded promos are now fallbacks
const fallbackPromos: Promo[] = [
  {
    id: 1,
    image: '/images/promo-transact-win.png',
    alt: 'Transact & Win - Easter weekend special',
    link: '/promotions/easter-special',
  },
  {
    id: 2,
    image: '/images/promo-winners.png',
    alt: 'Winners of K20 airtime',
    link: '/promotions/airtime-winners',
  },
  {
    id: 3,
    image: '/images/promo-game-day.png',
    alt: 'Game Day at NASDEC Complex Lusaka',
    link: '/promotions/game-day-lusaka',
  },
]

export function PromoCarousel({ className = '' }: PromoCarouselProps) {
  // 2) state for whatever we end up showing
  const [promos, setPromos] = useState<Promo[]>(fallbackPromos)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  // 3) on mount, try to fetch live promos
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('id, slug, image_url, title, link_url')
        .eq('is_active', true)
        .order('start_date', { ascending: false })

      if (!error && data && data.length > 0) {
        setPromos(
          data.map((p) => ({
            id: p.id,
            image: p.image_url || '/placeholder.svg',
            alt: p.title || p.slug,
            link: p.link_url || `/promotions/${p.slug}`,
          }))
        )
      }
      // if error or no rows, we keep fallbackPromos
    })()
  }, [])

  // rest is your carousel logic…
  const goToNext = () => {
    if (isAnimating) return
    setDirection('right')
    setIsAnimating(true)
    setCurrentIndex((i) => (i + 1) % promos.length)
  }
  const goToPrevious = () => {
    if (isAnimating) return
    setDirection('left')
    setIsAnimating(true)
    setCurrentIndex((i) => (i - 1 + promos.length) % promos.length)
  }
  useEffect(() => {
    const iv = setInterval(goToNext, 5000)
    return () => clearInterval(iv)
  }, [])

  const handleAnimationEnd = () => setIsAnimating(false)

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-lg ${className}`}>
      <div className="relative aspect-[16/9] md:aspect-[2/1] w-full h-48 md:h-56">
        {promos.map((promo, index) => (
          <Link
            key={promo.id}
            href={promo.link || '#'}
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${
              index === currentIndex
                ? 'opacity-100 z-10 scale-100'
                : 'opacity-0 z-0 scale-95'
            } ${
              isAnimating && index === currentIndex
                ? direction === 'right'
                  ? 'animate-slide-in-right'
                  : 'animate-slide-in-left'
                : ''
            }`}
            onAnimationEnd={handleAnimationEnd}
          >
            <Image
              src={promo.image}
              alt={promo.alt}
              fill
              className="object-cover"
              priority={index === currentIndex}
            />
          </Link>
        ))}
      </div>

      {/* Navigation */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {promos.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIndex ? 'right' : 'left')
              setIsAnimating(true)
              setCurrentIndex(idx)
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
