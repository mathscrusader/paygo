// app/api/referral/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { newUserId, referralCode, transactionId } = await request.json();
    if (!newUserId || !referralCode) {
      return NextResponse.json({ error: "Missing newUserId or referralCode" }, { status: 400 });
    }

    // Look up the referrer
    const { data: referrer, error: lookupError } = await supabaseAdmin
      .from("profiles")
      .select("id, reward_balance")
      .eq("referral_code", referralCode)
      .single();
    if (lookupError || !referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const referrerId = referrer.id;
    const newBalance = (referrer.reward_balance ?? 0) + 5000;

    // Build the payload, only add transaction_id if it exists
    const rewardRecord: any = {
      referrer_id:       referrerId,
      referred_user_id:  newUserId,
      reward_amount:     5000,
      status:            "pending",
    };
    if (transactionId) rewardRecord.transaction_id = transactionId;

    // Insert the reward record
    const { error: insertError } = await supabaseAdmin
      .from("ReferralRewards")
      .insert(rewardRecord);
    if (insertError) {
      console.error("ReferralRewards insert error:", insertError);
      throw insertError;
    }

    // Finally, update the referrer’s balance
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ reward_balance: newBalance })
      .eq("id", referrerId);
    if (updateError) {
      console.error("profiles update error:", updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true, newBalance });

  } catch (err: any) {
    console.error("Referral API unexpected error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
