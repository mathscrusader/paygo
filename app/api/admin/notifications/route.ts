import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET() {
  const [activationTx, upgradeTx, withdrawals] = await Promise.all([
    supabaseAdmin
      .from("Transaction")
      .select("id, amount, createdAt, userId")
      .eq("type", "activation")
      .eq("status", "PENDING")
      .eq("approved", false),
    supabaseAdmin
      .from("Transaction")
      .select("id, amount, createdAt, userId")
      .eq("type", "upgrade")
      .eq("status", "PENDING")
      .eq("approved", false),
    supabaseAdmin
      .from("withdrawals")
      .select("id, amount, created_at, user_id")
      .eq("status", "pending"),
  ])

  const all = [
    ...(activationTx.data || []).map((tx) => ({
      id: tx.id,
      type: "payid",
      amount: tx.amount,
      date: tx.createdAt,
    })),
    ...(upgradeTx.data || []).map((tx) => ({
      id: tx.id,
      type: "packages",
      amount: tx.amount,
      date: tx.createdAt,
    })),
    ...(withdrawals.data || []).map((w) => ({
      id: w.id,
      type: "withdrawals",
      amount: w.amount,
      date: w.created_at,
    })),
  ]

  return NextResponse.json({ data: all })
}
