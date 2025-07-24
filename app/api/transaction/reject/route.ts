// app/api/transaction/reject/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Ensure only ADMIN
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse transaction ID
  const { transactionId } = await req.json();
  if (!transactionId) {
    return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
  }

  // Mark transaction as rejected (or delete)
  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { approved: false },
  });

  return NextResponse.json(updated);
}
