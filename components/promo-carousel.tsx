"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PromoCarouselProps {
  className?: string
}

const promos = [
  {
    id: 1,
    image: "/images/promo-transact-win.png",
    alt: "Transact & Win - Easter weekend special",
  },
  {
    id: 2,
    image: "/images/promo-winners.png",
    alt: "Winners of K20 airtime",
  },
  {
    id: 3,
    image: "/images/promo-game-day.png",
    alt: "Game Day at NASDEC Complex Lusaka",
  },
]

export function PromoCarousel({ className = "" }: PromoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<"left" | "right">("right")

  const goToNext = () => {
    if (isAnimating) return
    setDirection("right")
    setIsAnimating(true)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % promos.length)
  }

  const goToPrevious = () => {
    if (isAnimating) return
    setDirection("left")
    setIsAnimating(true)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + promos.length) % promos.length)
  }

  useEffect(() => {
    // Auto-advance carousel
    const interval = setInterval(goToNext, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAnimationEnd = () => {
    setIsAnimating(false)
  }

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-lg ${className}`}>
      <div className="relative aspect-[16/9] md:aspect-[2/1] w-full h-48 md:h-56">
        {promos.map((promo, index) => (
          <div
            key={promo.id}
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-95"
            } ${
              isAnimating && index === currentIndex
                ? direction === "right"
                  ? "animate-slide-in-right"
                  : "animate-slide-in-left"
                : ""
            }`}
            onAnimationEnd={handleAnimationEnd}
          >
            <Image
              src={promo.image || "/placeholder.svg"}
              alt={promo.alt}
              fill
              className="object-cover"
              priority={index === currentIndex}
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-all"
        aria-label="Previous promotion"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-all"
        aria-label="Next promotion"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? "right" : "left")
              setIsAnimating(true)
              setCurrentIndex(index)
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-white scale-125" : "bg-white/50"
            }`}
            aria-label={`Go to promotion ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
