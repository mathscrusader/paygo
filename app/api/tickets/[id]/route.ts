// app/api/tickets/[id]/route.ts
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

  const { id } = params;
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
      ),
      ticket_comments (
        *,
        profiles ( full_name ),
        admin: User ( name )
      )
    `)
    .eq("id", id);

  if ((session.user as any).role !== "ADMIN") {
    qb = qb.eq("profile_id", session.user.id);
  }

  const { data, error } = await qb.single();
  if (error) return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const { status } = await req.json();
  if (!["open","in_progress","resolved","closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === "resolved") {
    updates.resolved_at = new Date().toISOString();
  }
  updates.admin_id = session.user.id;

  const { data, error } = await supabaseAdmin
    .from("tickets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}
