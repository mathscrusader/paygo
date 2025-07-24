import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email } = await req.json();

  // Find user in auth.users
  const { data: users, error: uErr } = await supabaseAdmin
    .from("auth.users")
    .select("id, email")
    .eq("email", email)
    .limit(1);

  if (uErr || !users || users.length === 0) {
    return NextResponse.json({ ok: true }); // don't leak
  }

  const user = users[0];
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hr

  const { error: insErr } = await supabaseAdmin.from("password_reset_tokens").insert({
    token,
    user_id: user.id,
    expires_at: expiresAt,
  });

  if (insErr) {
    return NextResponse.json({ message: "DB error" }, { status: 500 });
  }

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset/${token}`;
  await sendResetEmail(user.email, resetUrl);

  return NextResponse.json({ ok: true });
}
