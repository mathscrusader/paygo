// components/popup-manager.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers"

interface Popup {
  id: string
  title: string
  message: string
  duration_minutes: number
  max_displays_per_user: number
}

export function PopupManager() {
  const { session } = useAuth()
  const [popup, setPopup] = useState<Popup | null>(null)
  const [visible, setVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!session) return

    ;(async () => {
      const now = new Date().toISOString()
      // 1) Fetch one active popup
      const { data } = await supabase
        .from<Popup>("popups")
        .select("*")
        .lte("start_at", now)
        .gte("end_at", now)
        .single()
      if (!data) return

      // 2) Check how many times user has seen it
      const { data: uv } = await supabase
        .from("user_popup_views")
        .select("displayed_count")
        .eq("user_id", session.user.id)
        .eq("popup_id", data.id)
        .single()
      const count = uv?.displayed_count || 0
      if (count >= data.max_displays_per_user) return

      // 3) Show it
      setPopup(data)
      setVisible(true)
      setIsClosing(false)

      // 4) Upsert view count
      await supabase
        .from("user_popup_views")
        .upsert({
          user_id: session.user.id,
          popup_id: data.id,
          displayed_count: count + 1,
          last_displayed_at: now
        })
        .eq("user_id", session.user.id)
        .eq("popup_id", data.id)

      // 5) Hide after duration
      setTimeout(() => {
        setIsClosing(true)
        setTimeout(() => setVisible(false), 300)
      }, data.duration_minutes * 60 * 1000)
    })()
  }, [session])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => setVisible(false), 300)
  }

  if (!popup || !visible) return null

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Overlay with gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-900/70 to-indigo-900/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup card */}
      <div 
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-sm transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        style={{
          boxShadow: '0 10px 25px -5px rgba(76, 58, 140, 0.4)'
        }}
      >
        {/* OPay-style header with gradient */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 text-white p-5 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{popup.title}</h3>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close popup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body with subtle pattern */}
        <div className="p-6 bg-white relative overflow-hidden rounded-b-3xl">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-purple-100/30"></div>
          <div className="absolute -bottom-5 -left-5 w-16 h-16 rounded-full bg-purple-200/20"></div>
          
          <div className="relative z-10">
            <p className="text-gray-700 mb-6 leading-relaxed">{popup.message}</p>
            
            {/* Action buttons */}
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={handleClose}
                className="flex-1 py-3 px-4 border border-purple-500 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
              >
                Maybe Later
              </button>
              <button 
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
              >
                Take Action
              </button>
            </div>
          </div>
        </div>

        {/* OPay-style brand element */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="w-16 h-1.5 bg-purple-400/30 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}