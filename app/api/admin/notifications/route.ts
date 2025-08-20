import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import prisma from '@/lib/prisma';  // Assuming this is your Prisma client import

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single()

  if (userError || !user?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: pendingTransactions, error: transactionsError } =
    await supabaseAdmin
      .from("ClientTransaction")
      .select("id, amount, status, created_at, user_id, transaction_type")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

  const { data: pendingWithdrawals, error: withdrawalsError } =
    await supabaseAdmin
      .from("Withdrawal")
      .select("id, amount, status, created_at, user_id")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

  if (transactionsError || withdrawalsError) {
    return NextResponse.json(
      { error: "Internal Server Error", details: transactionsError?.message || withdrawalsError?.message },
      { status: 500 }
    )
  }

  const notifications = [
    ...(pendingTransactions || []).map((t) => ({
      ...t,
      type: "transaction",
    })),
    ...(pendingWithdrawals || []).map((w) => ({ ...w, type: "withdrawal" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json(notifications)
}

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session:', session);  // Debug log

  if (!session) {
    console.log('No session found');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const sessionUserId = session.user.id;

  // Check admin status using Prisma User table
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  console.log('User from Prisma:', user);  // Debug log

  if (!user || user.role !== 'ADMIN') {
    console.log('Forbidden: User is not admin');
    return NextResponse.json({ message: 'Forbidden: User is not admin' }, { status: 403 });
  }

  // Remove the following NextAuth role check as it's redundant with Supabase
  // const userRole = (session.user as any).role;
  // console.log('User Role:', userRole);
  // if (userRole !== "ADMIN") {
  //     console.log('Forbidden: User role is not ADMIN');
  //     return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  // }

  const { userId, userIds, title, message } = await req.json()

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
  }

  let targetUserIds: string[] = []

  if (userId) {
    targetUserIds = [userId]
  } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    targetUserIds = userIds
  } else {
    // If no specific users are targeted, send to all users.
    const { data: allUserIds, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')

    if (fetchError) {
      console.error('Error fetching all user IDs:', fetchError)
      return NextResponse.json(
        {
          message: 'Failed to fetch user IDs for broadcast.',
          error: fetchError.message,
        },
        { status: 500 },
      )
    }
    targetUserIds = allUserIds.map(user => user.id)
  }

  if (!targetUserIds || targetUserIds.length === 0) {
    return NextResponse.json(
      { message: 'No users to send notification to.' },
      { status: 400 },
    )
  }

  const notifications = targetUserIds.map(id => ({
    user_id: id,
    title,
    message,
  }))

  const { error: insertError } = await supabaseAdmin
    .from('notifications')
    .insert(notifications)

  if (insertError) {
    console.error('Error inserting notifications:', insertError)
    return NextResponse.json(
      {
        message: 'Failed to send notification.',
        error: insertError.message,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ message: 'Notification sent successfully.' })
}