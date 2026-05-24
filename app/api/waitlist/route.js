import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { apiLimiter } from "@/lib/rate-limit"

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    await apiLimiter.check(5, `waitlist:${ip}`)
  } catch {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 })
  }

  try {
    const { email, phone, pincode, source } = await request.json()
    const normalizedEmail = String(email || "").trim().toLowerCase()
    const normalizedPhone = String(phone || "").trim()

    if (!normalizedEmail && !normalizedPhone) {
      return NextResponse.json({ error: "Email or phone is required." }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("waitlist_signups")
      .insert({
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        pincode: pincode || null,
        source: source || "landing",
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to join waitlist" }, { status: 500 })
  }
}
