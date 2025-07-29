// app/api/referral/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // your server‐side client

export async function POST(request: Request) {
  const { newUserId, referralCode, transactionId } = await request.json();

  if (!newUserId || !referralCode) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // 1) Find the referrer’s user record
  const { data: referrerProfile, error: lookupError } = await supabaseAdmin
    .from("profiles")
    .select("id, reward_balance")
    .eq("referral_code", referralCode)
    .single();

  if (lookupError || !referrerProfile) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  const referrerId = referrerProfile.id;

  // 2) Insert into ReferralRewards
  const { error: insertError } = await supabaseAdmin
    .from("ReferralRewards")
    .insert({
      referrer_id: referrerId,
      referred_user_id: newUserId,
      transaction_id: transactionId || null,
      reward_amount: 5000,
      status: "pending",
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 3) Update referrer’s balance
  const newBalance = (referrerProfile.reward_balance ?? 0) + 5000;
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ reward_balance: newBalance })
    .eq("id", referrerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, newBalance });
}
