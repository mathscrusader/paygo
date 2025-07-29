// app/api/tickets/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: ticket_id } = params;
  let qb = supabaseAdmin
    .from("ticket_comments")
    .select(`
      *,
      profiles ( full_name ),
      admin: User ( name )
    `)
    .eq("ticket_id", ticket_id)
    .order("created_at", { ascending: true });

  // Non-admins can only read comments on their own tickets
  if ((session.user as any).role !== "ADMIN") {
    qb = qb.eq("profile_id", session.user.id);
  }

  const { data, error } = await qb;
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const insert = {
    ticket_id: params.id,
    message,
    profile_id: isAdmin ? null : session.user.id,
    admin_id: isAdmin ? session.user.id : null,
  };

  const { data, error } = await supabaseAdmin
    .from("ticket_comments")
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
