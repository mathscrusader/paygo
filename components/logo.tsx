import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={cn("relative transition-all duration-500 hover:scale-105", className)}>
      <div className="animate-pulse-slow overflow-hidden rounded-md">
        <Image
          src="/images/paygo-logo.png"
          alt="PayGo Logo"
          width={400}
          height={160}
          className="w-full h-auto animate-shimmer"
          priority
        />
      </div>
    </div>
  )
}
