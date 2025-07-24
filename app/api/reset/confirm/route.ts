import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const { data: rows, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("user_id, expires_at")
    .eq("token", token)
    .limit(1);

  if (error || !rows || rows.length === 0) {
    return NextResponse.json({ message: "Invalid token" }, { status: 400 });
  }

  const row = rows[0];
  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ message: "Token expired" }, { status: 400 });
  }

  // Hash & update in auth.users
  const hashed = await bcrypt.hash(password, 10);

  // Update password via auth admin API
  const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
    password: hashed,
  });

  if (updErr) {
    return NextResponse.json({ message: updErr.message }, { status: 500 });
  }

  await supabaseAdmin.from("password_reset_tokens").delete().eq("token", token);

  return NextResponse.json({ ok: true });
}
