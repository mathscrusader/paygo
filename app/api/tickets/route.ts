// app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build base query
  let qb = supabaseAdmin
    .from("tickets")
    .select(`
      *,
      profiles (
        full_name,
        email
      ),
      admin: User (
        id,
        name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  // If not admin, filter to own tickets
  if ((session.user as any).role !== "ADMIN") {
    qb = qb.eq("profile_id", session.user.id);
  }

  const { data, error } = await qb;
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, description, category, priority } = await req.json();
  if (!subject || !description) {
    return NextResponse.json(
      { error: "subject and description are required" },
      { status: 400 }
    );
  }

  const insert = {
    profile_id: session.user.id,
    subject,
    description,
    category: category || null,
    priority: priority || "medium",
  };

  const { data, error } = await supabaseAdmin
    .from("tickets")
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
