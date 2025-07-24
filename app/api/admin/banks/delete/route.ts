// app/api/admin/banks/delete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  // ❌ Protect the route
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 📝 Parse payload
  const { id } = await request.json();

  // 🗑️ Delete the bank record
  const { error } = await supabase.from("Bank").delete().eq("id", id);

  if (error) {
    console.error("Bank delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
