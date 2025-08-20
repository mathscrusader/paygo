import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(req: Request) {
  try {
    const { userId, suspend } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    if (typeof suspend !== "boolean") {
      return NextResponse.json({ error: "suspend must be a boolean value" }, { status: 400 })
    }
    
    // Update the user's suspension status in the profiles table
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_suspended: suspend })
      .eq("id", userId)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: suspend ? "User has been suspended" : "User has been unsuspended" 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}