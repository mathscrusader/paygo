// lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  throw new Error(
    "❌ Missing Supabase env vars for admin client. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  )
}

// Prevent accidental use in the browser bundle
if (typeof window !== "undefined") {
  throw new Error("supabaseAdmin must only be imported/used on the server.")
}

// Singleton to avoid multiple instances during dev HMR
let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "x-application-name": "paygo-admin",
        },
      },
    })
  }
  return _admin
}

export const supabaseAdmin = getSupabaseAdmin()
