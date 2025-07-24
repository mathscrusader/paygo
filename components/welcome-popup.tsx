"use client"

import { useState } from "react"
import { X, Gift, Zap, CreditCard, ArrowRight, Phone, Wallet, Users, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomePopupProps {
  userName: string
  onClose: () => void
}

export function WelcomePopup({ userName, onClose }: WelcomePopupProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-0 overflow-hidden shadow-2xl">
        {/* Header with progress indicator */}
        <div className="relative bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold mb-1">Welcome to PayGo, {userName}!</h2>
          <p className="text-sm text-purple-100">
            Step {currentStep} of {totalSteps}
          </p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index < currentStep ? "bg-white" : "bg-white/30"
                } transition-all duration-300`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Welcome Bonus</h3>
              <p className="text-gray-600 mb-4">
                You've received a welcome bonus of ₦180,000! This amount is already in your account and can be withdrawn
                after purchasing a PAY ID.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Get Your PAY ID</h3>
              <p className="text-gray-600 mb-4">
                To withdraw funds, you'll need to purchase a PAY ID for ₦7,250. This is a one-time purchase that unlocks
                all features of the app.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Airtime & Data</h3>
              <p className="text-gray-600 mb-4">
                You can purchase airtime and data for all major networks directly from the app. Simply select the
                service, enter the phone number, choose your plan, and complete your purchase.
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Withdrawal Process</h3>
              <p className="text-gray-600 mb-4">
                To withdraw your funds, tap the "Withdraw" button on your dashboard, enter your bank details and PAY ID,
                and submit your request. Withdrawals are processed within 24 hours.
              </p>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Earn More</h3>
              <p className="text-gray-600 mb-4">
                Explore our app to discover ways to earn more! Refer friends to earn ₦500 per referral, join our
                communities, and take advantage of special promotions.
              </p>
              <div className="flex justify-center gap-4 mb-2">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mb-1">
                    <Users className="h-5 w-5 text-pink-600" />
                  </div>
                  <span className="text-xs text-gray-500">Communities</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mb-1">
                    <HelpCircle className="h-5 w-5 text-teal-600" />
                  </div>
                  <span className="text-xs text-gray-500">Support</span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleNext}
            className="w-full bg-purple-600 hover:bg-purple-700 mt-4 rounded-full flex items-center justify-center gap-2"
          >
            {currentStep < totalSteps ? "Next" : "Get Started"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
