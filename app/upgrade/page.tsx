// app/upgrade/page.tsx
"use client"

import { useState, useEffect, ElementType, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  Zap,
  Award,
  Crown,
  Diamond,
  Star,
  Gem
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers"

interface Level {
  id: string          // key
  name: string
  shortName: string
  price: number
  icon: ElementType
  color: string
  bgColor: string
  borderColor: string
}

interface LocalUser {
  level?: string
  [k: string]: any
}

export default function UpgradePage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  const [localUser, setLocalUser] = useState<LocalUser | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stabilizedRef = useRef(false)

  /** Graceful auth guard */
  useEffect(() => {
    if (loading) return
    if (stabilizedRef.current) return

    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }

    if (!session) {
      redirectTimeoutRef.current = setTimeout(() => {
        if (!session) {
          stabilizedRef.current = true
          router.replace("/login")
        }
      }, 400)
    } else {
      stabilizedRef.current = true
    }

    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  /** Load local fallback user data (for level / balance display) */
  useEffect(() => {
    if (!session) return
    const raw = localStorage.getItem("paygo-user")
    if (raw) {
      try {
        setLocalUser(JSON.parse(raw))
      } catch {
        setLocalUser({})
      }
    } else {
      setLocalUser({})
    }
  }, [session])

  /** Fetch upgrade levels from Supabase */
  useEffect(() => {
    if (!session) return
    ;(async () => {
      const { data, error } = await supabase
        .from("UpgradeLevel")
        .select("id, key, name, price")
        .order("price", { ascending: true })

      if (error) {
        console.error("Failed to load levels:", error)
        return
      }

      const iconMap: Record<string, ElementType> = {
        silver: Shield,
        gold: Award,
        platinum: Zap,
        emerald: Gem,
        ruby: Star,
        diamond: Crown,
        black: Diamond
      }

      const mapped: Level[] = (data || []).map(row => ({
        id: row.key,
        name: row.name,
        shortName: row.name.split(" ")[0],
        price: row.price,
        icon: iconMap[row.key] || Shield,
        color: "text-gray-700",
        bgColor: "bg-white",
        borderColor: "border-gray-200"
      }))

      setLevels(mapped)
      if (mapped.length) setSelectedLevel(mapped[0].id)
    })()
  }, [session])

  const handleViewBenefits = () => {
    if (!selectedLevel) return
    const lvl = levels.find(l => l.id === selectedLevel)
    localStorage.setItem(
      "paygo-selected-level",
      JSON.stringify({
        id: selectedLevel,
        name: lvl?.name,
        price: lvl?.price
      })
    )
    router.push("/upgrade/benefits")
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
      .format(amount)
      .replace("NGN", "₦")

  /** Render states */
  if (loading || (session && !localUser && !stabilizedRef.current)) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!session && stabilizedRef.current) {
    return <div className="p-6 text-center">Redirecting…</div>
  }
  if (!session) {
    return <div className="p-6 text-center">Loading...</div>
  }
  if (!localUser) {
    return <div className="p-6 text-center">Preparing...</div>
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      <div className="flex items-center p-4 bg-purple-600 text-white">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-xl">Upgrade Account</span>
        </Link>
      </div>

      <div className="p-4 space-y-5">
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">Choose Your Level</h2>
          <p className="text-gray-600 text-xs mt-1">
            Select a level to view benefits and upgrade
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Award className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Level</p>
              <p className="font-medium text-sm">{localUser.level || "Basic"}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-gray-700 font-medium text-sm mb-2">
            Select Level to Upgrade
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {levels.map(level => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 ease-in-out",
                  "border rounded-lg p-2",
                  "flex flex-col items-center justify-center text-center",
                  "hover:shadow-sm active:scale-[0.98]",
                  selectedLevel === level.id
                    ? `${level.borderColor} ${level.bgColor} shadow-sm`
                    : "border-gray-200 bg-white"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center mb-1",
                    selectedLevel === level.id ? level.bgColor : "bg-gray-100"
                  )}
                >
                  <level.icon
                    className={cn(
                      "h-3.5 w-3.5",
                      selectedLevel === level.id
                        ? level.color
                        : "text-gray-500"
                    )}
                  />
                </div>
                <h4 className="font-bold text-xs">{level.shortName}</h4>
                <p
                  className={cn(
                    "font-medium text-xs",
                    selectedLevel === level.id ? level.color : "text-gray-600"
                  )}
                >
                  {formatCurrency(level.price)}
                </p>

                {selectedLevel === level.id && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-transparent border-r-purple-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleViewBenefits}
          disabled={!selectedLevel}
          className={cn(
            "w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl mt-3",
            "transition-all duration-300 ease-in-out",
            "hover:shadow-lg active:scale-[0.98]",
            !selectedLevel && "opacity-60 cursor-not-allowed"
          )}
        >
          View Benefits
        </Button>

        <p className="text-center text-xs text-gray-500">
          Select a level to view detailed benefits before payment
        </p>
      </div>
    </div>
  )
}
