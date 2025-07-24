import { Shield, Zap, Award, Crown, Diamond, Star, Gem } from "lucide-react"

interface LevelBadgeProps {
  level: string
  size?: "sm" | "md" | "lg"
  showName?: boolean
  className?: string
}

export function LevelBadge({ level, size = "md", showName = false, className = "" }: LevelBadgeProps) {
  const levelConfig = {
    basic: {
      icon: Shield,
      color: "bg-gray-100 text-gray-500 border-gray-300",
      name: "Basic",
    },
    silver: {
      icon: Shield,
      color: "bg-gray-200 text-gray-700 border-gray-400",
      name: "Silver",
    },
    gold: {
      icon: Award,
      color: "bg-yellow-100 text-yellow-700 border-yellow-400",
      name: "Gold",
    },
    platinum: {
      icon: Zap,
      color: "bg-blue-100 text-blue-700 border-blue-400",
      name: "Platinum",
    },
    emerald: {
      icon: Gem,
      color: "bg-green-100 text-green-700 border-green-400",
      name: "Emerald",
    },
    ruby: {
      icon: Star,
      color: "bg-red-100 text-red-700 border-red-400",
      name: "Ruby",
    },
    diamond: {
      icon: Crown,
      color: "bg-purple-100 text-purple-700 border-purple-400",
      name: "Diamond",
    },
    black: {
      icon: Diamond,
      color: "bg-gray-900 text-white border-gray-700",
      name: "Black Elite",
    },
  }

  const config = levelConfig[level.toLowerCase() as keyof typeof levelConfig] || levelConfig.basic

  const Icon = config.icon
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full ${config.color} border flex items-center justify-center`}>
        <Icon className={size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      {showName && <span className="font-medium">{config.name}</span>}
    </div>
  )
}
