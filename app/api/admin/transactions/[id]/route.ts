// app/api/admin/transactions/[id]/route.ts
export const runtime = "nodejs" // ensure Node runtime so service key works

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { approve } = await req.json()
    if (typeof approve !== "boolean") {
      return NextResponse.json({ error: "approve must be boolean" }, { status: 400 })
    }

    const status = approve ? "APPROVED" : "REJECTED"

    const { error } = await supabaseAdmin
      .from("Transaction")
      .update({ approved: approve, status })
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
