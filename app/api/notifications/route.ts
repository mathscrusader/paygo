import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notifications:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { notificationId } = await req.json()

  if (!notificationId) {
    return new NextResponse("Notification ID is required", { status: 400 })
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", session.user.id)

  if (error) {
    console.error("Error marking notification as read:", error)
    return new NextResponse("Failed to mark as read", { status: 500 })
  }

  return new NextResponse("Notification marked as read", { status: 200 })
}