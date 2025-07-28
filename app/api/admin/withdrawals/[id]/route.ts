import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json()

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("withdrawals") // ✅ Ensure lowercase matches actual table name
    .update({ status })
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
