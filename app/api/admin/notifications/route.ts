import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

// POST function for sending notifications
export async function POST(request: Request) {
  try {
    // Get data from request with no authentication checks
    const { userId, userIds, title, message } = await request.json()
    
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    let targetUserIds: string[] = []

    if (userId) {
      targetUserIds = [userId]
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds
    } else {
      // If no specific users are targeted, send to all users
      const { data: allUserIds, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id')

      if (fetchError) {
        console.error('Error fetching all user IDs:', fetchError)
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }
      
      targetUserIds = allUserIds.map(user => user.id)
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: 'No users to send notification to' }, { status: 400 })
    }

    // Create notification objects for each target user
    const notifications = targetUserIds.map(id => ({
      user_id: id,
      title,
      message,
    }))

    // Insert directly into the notifications table
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Error inserting notifications:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notification sent successfully' })
  } catch (error) {
    console.error('Unexpected error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Single GET function implementation that doesn't require admin role
export async function GET() {
  try {
    const { data: pendingTransactions, error: transactionsError } = await supabaseAdmin
      .from("ClientTransaction")
      .select("id, amount, status, created_at, user_id, transaction_type")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    const { data: pendingWithdrawals, error: withdrawalsError } = await supabaseAdmin
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
  } catch (error) {
    console.error('Unexpected error in notifications GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}