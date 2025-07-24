"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Script from "next/script"
import { useAuth } from "@/app/providers"
import { fetchActiveVideos } from "@/lib/videos"

interface Video {
  id: number
  title: string
  provider: string
  provider_video_id: string
  embed_url: string
  description?: string
  sort_order: number
}

export default function WatchPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Auth gate with small grace window to avoid transient null during token refresh.
   */
  useEffect(() => {
    if (loading) return
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }
    if (!session) {
      redirectTimeoutRef.current = setTimeout(() => {
        // re-check before redirect – session might have arrived
        if (!session) router.replace("/login")
      }, 400) // 400ms grace
    }
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [loading, session, router])

  /**
   * Fetch videos once session is present.
   */
  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        const vids = await fetchActiveVideos()
        setVideos(vids)
      } catch (e) {
        console.error("Failed to load videos:", e)
      } finally {
        setLoadingVideos(false)
      }
    })()
  }, [session])

  const stillLoading = loading || (session && loadingVideos)

  if (stillLoading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  // If after grace we still have no session, show neutral message (redirect effect handles navigation)
  if (!session) {
    return <div className="p-6 text-center">Redirecting…</div>
  }

  const first = videos[0]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Watch</span>
        </Link>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-medium mb-3">
          {first ? first.title : "No videos available"}
        </h2>

        {first ? (
          <div className="mb-2">
            <div style={{ padding: "222.22% 0 0 0", position: "relative" }}>
              <iframe
                src={first.embed_url}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                title={first.title}
              />
            </div>
            <Script src="https://player.vimeo.com/api/player.js" strategy="lazyOnload" />
            {first.description && (
              <p className="text-sm text-gray-600 mt-3">{first.description}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Please check back later.</p>
        )}
      </div>
    </div>
  )
}
