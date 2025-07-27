import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://prthzlpadsqedjlgubfx.supabase.co"
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydGh6bHBhZHNxZWRqbGd1YmZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjU2MywiZXhwIjoyMDY4MDg4NTYzfQ.hHztfN9ujmigCkRrhDPhdWSbw_gWHSOZszgC3zJ6FfI"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function createAdminUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "mathscrusader@gmail.com",
    password: "MATHEMATICs1.",
    email_confirm: true,
  })

  if (error) {
    console.error("❌ Failed to create admin user:", error.message)
    return
  }

  console.log("✅ Admin user created in auth.users:", data.user)

  // Promote in `profiles` table
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_admin: true }) // You must first add `is_admin` column
    .eq("id", data.user.id)

  if (updateError) {
    console.error("⚠️ Failed to promote in 'profiles':", updateError.message)
  } else {
    console.log("✅ User promoted to admin in 'profiles'")
  }
}

createAdminUser()
