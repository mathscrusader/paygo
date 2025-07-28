import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("withdrawals")
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
        profiles (
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    console.log("🔍 WITHDRAWALS API DATA:", data)
    console.log("🔴 WITHDRAWALS API ERROR:", error)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (e: any) {
    console.error("💥 API Crashed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
