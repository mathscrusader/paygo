import { Check, X } from "lucide-react"
import { LevelBadge } from "./level-badge"

interface LevelComparisonProps {
  className?: string
}

export function LevelComparison({ className = "" }: LevelComparisonProps) {
  const features = [
    { name: "Referral Bonus", description: "Earn money for each referral" },
    { name: "Weekly Rewards", description: "Automatic weekly earnings" },
    { name: "Customer Support", description: "Access to support services" },
    { name: "Transaction Fees", description: "Fees on withdrawals and transfers" },
    { name: "Exclusive Promotions", description: "Access to special offers" },
    { name: "Bonus Earnings", description: "Extra percentage on all earnings" },
    { name: "Special Rewards", description: "Additional periodic rewards" },
    { name: "Investment Opportunities", description: "Access to investment options" },
    { name: "Withdrawal Limits", description: "Maximum daily withdrawal" },
    { name: "Account Manager", description: "Dedicated support person" },
    { name: "Offline Events", description: "Invitation to exclusive events" },
  ]

  const levels = [
    {
      id: "basic",
      name: "Basic",
      features: {
        "Referral Bonus": "₦200",
        "Weekly Rewards": "₦2,000",
        "Customer Support": "Basic",
        "Transaction Fees": "2.5%",
        "Exclusive Promotions": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Bonus Earnings": "0%",
        "Special Rewards": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Investment Opportunities": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Withdrawal Limits": "₦50,000",
        "Account Manager": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Offline Events": <X className="h-5 w-5 text-red-500 mx-auto" />,
      },
    },
    {
      id: "silver",
      name: "Silver",
      features: {
        "Referral Bonus": "₦500",
        "Weekly Rewards": "₦5,000",
        "Customer Support": "Basic",
        "Transaction Fees": "2%",
        "Exclusive Promotions": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Bonus Earnings": "0%",
        "Special Rewards": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Investment Opportunities": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Withdrawal Limits": "₦100,000",
        "Account Manager": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Offline Events": <X className="h-5 w-5 text-red-500 mx-auto" />,
      },
    },
    {
      id: "gold",
      name: "Gold",
      features: {
        "Referral Bonus": "₦1,000",
        "Weekly Rewards": "₦10,000",
        "Customer Support": "Priority",
        "Transaction Fees": "1%",
        "Exclusive Promotions": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Bonus Earnings": "5%",
        "Special Rewards": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Investment Opportunities": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Withdrawal Limits": "₦200,000",
        "Account Manager": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Offline Events": <X className="h-5 w-5 text-red-500 mx-auto" />,
      },
    },
    {
      id: "platinum",
      name: "Platinum",
      features: {
        "Referral Bonus": "₦2,000",
        "Weekly Rewards": "₦20,000",
        "Customer Support": "VIP",
        "Transaction Fees": "0%",
        "Exclusive Promotions": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Bonus Earnings": "10%",
        "Special Rewards": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Investment Opportunities": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Withdrawal Limits": "₦500,000",
        "Account Manager": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Offline Events": <X className="h-5 w-5 text-red-500 mx-auto" />,
      },
    },
    {
      id: "emerald",
      name: "Emerald",
      features: {
        "Referral Bonus": "₦3,000",
        "Weekly Rewards": "₦30,000",
        "Customer Support": "Premium",
        "Transaction Fees": "0%",
        "Exclusive Promotions": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Bonus Earnings": "10%",
        "Special Rewards": "Monthly",
        "Investment Opportunities": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Withdrawal Limits": "₦750,000",
        "Account Manager": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Offline Events": <X className="h-5 w-5 text-red-500 mx-auto" />,
      },
    },
    {
      id: "ruby",
      name: "Ruby",
      features: {
        "Referral Bonus": "₦4,000",
        "Weekly Rewards": "₦40,000",
        "Customer Support": "Premium",
        "Transaction Fees": "0%",
        "Exclusive Promotions": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Bonus Earnings": "15%",
        "Special Rewards": "Monthly",
        "Investment Opportunities": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Withdrawal Limits": "₦1,000,000",
        "Account Manager": <X className="h-5 w-5 text-red-500 mx-auto" />,
        "Offline Events": <X className="h-5 w-5 text-red-500 mx-auto" />,
      },
    },
    {
      id: "diamond",
      name: "Diamond",
      features: {
        "Referral Bonus": "₦5,000",
        "Weekly Rewards": "₦50,000",
        "Customer Support": "24/7 Dedicated",
        "Transaction Fees": "0%",
        "Exclusive Promotions": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Bonus Earnings": "20%",
        "Special Rewards": "Monthly",
        "Investment Opportunities": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Withdrawal Limits": "₦2,000,000",
        "Account Manager": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Offline Events": <X className="h-5 w-5 text-red-500 mx-auto" />,
      },
    },
    {
      id: "black",
      name: "Black Elite",
      features: {
        "Referral Bonus": "₦10,000",
        "Weekly Rewards": "₦100,000",
        "Customer Support": "Personal Manager",
        "Transaction Fees": "0%",
        "Exclusive Promotions": "VIP",
        "Bonus Earnings": "25%",
        "Special Rewards": "Quarterly",
        "Investment Opportunities": "Premium",
        "Withdrawal Limits": "Unlimited",
        "Account Manager": <Check className="h-5 w-5 text-green-500 mx-auto" />,
        "Offline Events": <Check className="h-5 w-5 text-green-500 mx-auto" />,
      },
    },
  ]

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-white z-10">
              Feature
            </th>
            {levels.map((level) => (
              <th
                key={level.id}
                className="p-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                <div className="flex flex-col items-center justify-center">
                  <LevelBadge level={level.id} size="sm" />
                  <span className="mt-1">{level.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="hover:bg-gray-50">
              <td className="p-3 border-b border-gray-200 text-sm sticky left-0 bg-white z-10">
                <div>
                  <p className="font-medium text-gray-900">{feature.name}</p>
                  <p className="text-gray-500 text-xs">{feature.description}</p>
                </div>
              </td>
              {levels.map((level) => (
                <td key={`${level.id}-${feature.name}`} className="p-3 border-b border-gray-200 text-center text-sm">
                  {level.features[feature.name as keyof typeof level.features]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
