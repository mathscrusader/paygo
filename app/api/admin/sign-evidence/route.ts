import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const BUCKET = "payment-evidence"

export async function POST(req: NextRequest) {
  try {
    const { pathOrUrl } = await req.json()
    if (!pathOrUrl) {
      return NextResponse.json({ error: "pathOrUrl required" }, { status: 400 })
    }

    // If it's already a full signed URL, just return it
    if (pathOrUrl.startsWith("http") && pathOrUrl.includes("/object/sign/")) {
      return NextResponse.json({ url: pathOrUrl })
    }

    // If it's a full public URL, strip to storage path
    const markers = [
      `/storage/v1/object/public/${BUCKET}/`,
      `/storage/v1/object/sign/${BUCKET}/`,
      `/storage/v1/object/${BUCKET}/`, // just in case
    ]
    let storagePath = pathOrUrl
    if (pathOrUrl.startsWith("http")) {
      const cleaned = pathOrUrl.split("?")[0]
      for (const m of markers) {
        const idx = cleaned.indexOf(m)
        if (idx !== -1) {
          storagePath = cleaned.slice(idx + m.length)
          break
        }
      }
    }

    // If it’s still a URL (couldn’t extract), bail out with what we got
    if (storagePath.startsWith("http")) {
      return NextResponse.json({ url: storagePath })
    }

    // Create signed URL (2 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 120)

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || "Could not sign URL" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
