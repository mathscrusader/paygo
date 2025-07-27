import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://prthzlpadsqedjlgubfx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydGh6bHBhZHNxZWRqbGd1YmZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjU2MywiZXhwIjoyMDY4MDg4NTYzfQ.hHztfN9ujmigCkRrhDPhdWSbw_gWHSOZszgC3zJ6FfI"
)

async function createAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "mathscrusader@gmail.com",
    password: "MATHEMATICs1.",
    email_confirm: true,
  })

  if (error) return console.error("❌ Failed:", error.message)
  console.log("✅ Admin user created:", data.user)
}

createAdmin()
