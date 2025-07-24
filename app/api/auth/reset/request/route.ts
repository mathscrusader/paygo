// app/api/auth/reset/request/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path
import crypto from "crypto";
import { sendResetEmail } from "@/lib/email"; // implement with nodemailer, resend, etc.

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // return ok anyway to avoid leaking emails
    return NextResponse.json({ ok: true });
  }

  // create token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: expires,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset/${token}`;
  await sendResetEmail(user.email, resetUrl);

  return NextResponse.json({ ok: true });
}
