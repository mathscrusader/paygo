"use client"
import { X, Share2, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReferralPopupProps {
  onClose: () => void
}

export function ReferralPopup({ onClose }: ReferralPopupProps) {
  const referralCode = "PAYGO-" + Math.random().toString(36).substring(2, 8).toUpperCase()
  const referralLink = `https://paygo-finance.vercel.app/register?ref=${referralCode}`

  // Promotional text to copy along with the link
  const promotionalText = `Join PayGo and get ₦180,000 welcome bonus instantly! I'm already earning with PayGo. Sign up using my link: ${referralLink}`

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(promotionalText)
    window.open(`https://wa.me/?text=${message}`, "_blank")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Share2 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold">Refer & Earn</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-base font-bold mb-2">Earn ₦5,000!</h3>
            <p className="text-gray-600 text-sm">
              Invite your friends using your referral link.
Earn ₦5,000 for each successful signup.
Get a discount on your PAY ID purchase.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleShareWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 h-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="white"
              stroke="currentColor"
              strokeWidth="0"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
            </svg>
            Share on WhatsApp
          </Button>

          <p className="text-center text-xs text-gray-500 mt-3">Start earning and save on PAY ID costs today!</p>
        </div>
      </div>
    </div>
  )
}
