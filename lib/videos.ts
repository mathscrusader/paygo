// lib/videos.ts
import { supabase } from "@/lib/supabase"

export async function fetchActiveVideos() {
  const { data, error } = await supabase
    .from("videos")
    .select("id, title, provider, provider_video_id, embed_url, description, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return data
}
