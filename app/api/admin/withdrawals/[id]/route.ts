import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json()
  const id = params.id

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
  }

  // Get the withdrawal info first
  const { data: withdrawal, error: fetchError } = await supabaseAdmin
    .from("withdrawals")
    .select("id, user_id, amount, status")
    .eq("id", id)
    .maybeSingle()

  if (fetchError || !withdrawal) {
    return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })
  }

  // Credit back to wallet if rejected
  if (status === "rejected") {
    const { error: updateWalletError } = await supabaseAdmin.rpc("credit_user_wallet", {
      uid: withdrawal.user_id,
      amount: withdrawal.amount,
    })

    if (updateWalletError) {
      return NextResponse.json(
        { error: "Failed to credit wallet: " + updateWalletError.message },
        { status: 500 }
      )
    }
  }

  // Update withdrawal status
  const { error: updateStatusError } = await supabaseAdmin
    .from("withdrawals")
    .update({ status })
    .eq("id", id)

  if (updateStatusError) {
    return NextResponse.json(
      { error: "Failed to update withdrawal: " + updateStatusError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
