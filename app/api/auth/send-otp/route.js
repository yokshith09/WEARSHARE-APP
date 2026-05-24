import { NextResponse } from "next/server"
import { supabasePublic } from "@/lib/supabase"
import { apiLimiter } from "@/lib/rate-limit"

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    await apiLimiter.check(3, `otp:${ip}`)
  } catch {
    return NextResponse.json({ error: "Too many OTP requests. Please try again later." }, { status: 429 })
  }

  try {
    const { phone } = await request.json()
    const normalizedPhone = String(phone || "").replace(/\s/g, "")

    if (!/^\+91\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Enter a valid Indian phone number in +91 format." }, { status: 400 })
    }

    const { error } = await supabasePublic.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to send OTP" }, { status: 500 })
  }
}
