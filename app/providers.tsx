"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { usePathname, useRouter } from "next/navigation"

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  isSuspended: boolean
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  refresh: async () => {},
  isSuspended: false,
})

export function Providers({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)
  const initRef = useRef(false)
  const router = useRouter()
  const pathname = usePathname()

  const refresh = async () => {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
  }

  // Check if user is suspended
  useEffect(() => {
    if (!session || !session.user) return

    const checkSuspensionStatus = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_suspended")
        .eq("id", session.user.id)
        .single()

      if (!error && data) {
        setIsSuspended(data.is_suspended || false)
      }
    }

    checkSuspensionStatus()
  }, [session, supabase])

  // Handle redirection for suspended users
  useEffect(() => {
    if (!session || loading) return

    // If user is suspended and trying to access protected pages
    if (isSuspended && 
        pathname !== "/suspended-account" && 
        pathname !== "/support" && 
        pathname !== "/login" && 
        !pathname.startsWith("/auth/")) {
      router.replace("/suspended-account")
    }
  }, [isSuspended, pathname, router, session, loading])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let mounted = true

    // Initial fetch
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    // Listen to auth events (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
    })

    // Fallback periodic refresh (cover silent tab resume)
    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) setSession(data.session ?? null)
      })
    }, 55_000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [supabase])

  const user = session?.user ?? null

  return (
    <AuthContext.Provider value={{ session, user, loading, refresh, isSuspended }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
