// app/api/admin/banks/create/route.ts

// Opt out of prerendering/static analysis
export const dynamic = "force-dynamic";
// Ensure this runs in the Node.js runtime (so URL isn’t parsed at build time)
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  // 1️⃣ Protect the route
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2️⃣ Parse the incoming JSON
  const { name, accountnumber, accountname, logo, status, statuscolor, badge } =
    await request.json();

  // 3️⃣ Insert into Supabase
  const { data, error } = await supabase
    .from("bank")
    .insert({
      name,
      accountnumber,
      accountname,
      logo,
      status,
      statuscolor,
      badge,
    });

  if (error) {
    console.error("Bank create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4️⃣ Return the new record
  return NextResponse.json({ bank: data[0] }, { status: 201 });
}
