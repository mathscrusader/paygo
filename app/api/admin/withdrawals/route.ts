// app/api/admin/withdrawals/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("Withdrawals")
    .select(`
      id,
      user_id,
      amount,
      account_name,
      bank_name,
      account_number,
      method,
      status,
      created_at,
      user:profiles ( full_name )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
