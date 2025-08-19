import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

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

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  console.log('Session:', session);  // Debug: Log the entire session object

  if (!session) {
    console.log('No session found');  // Debug: Log if no session
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  console.log('User Admin Status:', user?.is_admin);  // Debug: Log the admin status

  if (userError || !user?.is_admin) {
    console.log('Forbidden: User is not admin');  // Debug: Log if admin check fails
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const userRole = (session.user as any).role;
  console.log('User Role:', userRole);  // Debug: Log the user role

  if (userRole !== "ADMIN") {
      console.log('Forbidden: User role is not ADMIN');  // Debug: Log if role check fails
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Remove the Supabase admin check since we're using NextAuth role
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