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

    // 1. Update the transaction
    const { data: txData, error: txError } = await supabaseAdmin
      .from("Transaction")
      .update({ approved: approve, status })
      .eq("id", params.id)
      .select("id, userId, type")
      .single()

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 400 })
    }

    // 2. If approved & it's an upgrade, check for referral reward
    if (approve && txData.type === "upgrade") {
      // 2a. Get the referred_by value from the user's profile
      const { data: userProfile, error: userProfileError } = await supabaseAdmin
        .from("profiles")
        .select("referred_by")
        .eq("id", txData.userId)
        .single()

      if (!userProfileError && userProfile?.referred_by) {
        // 2b. Find the referrer's user ID by their referral_code
        const { data: referrerProfile, error: referrerError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("referral_code", userProfile.referred_by)
          .single()

        if (!referrerError && referrerProfile?.id) {
          // 2c. Check if a reward has already been given for this transaction
          const { data: existingReward } = await supabaseAdmin
            .from("referralrewards")
            .select("id")
            .eq("transaction_id", txData.id)
            .maybeSingle()

          if (!existingReward) {
            // 2d. Create reward entry
            await supabaseAdmin.from("referralrewards").insert([
              {
                referrer_id: referrerProfile.id,
                referred_user_id: txData.userId,
                transaction_id: txData.id,
                reward_amount: 5000,
                status: "pending",
              },
            ])
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
