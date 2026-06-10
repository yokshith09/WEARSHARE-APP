import { NextResponse } from "next/server"
import { supabasePublic } from "@/lib/supabase"
import { apiLimiter } from "@/lib/rate-limit"

export async function POST(request) {
  try {
    const { phone } = await request.json()
    const normalizedPhone = String(phone || "").replace(/\s/g, "")

    if (!/^\+91\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Enter a valid Indian phone number in +91 format." }, { status: 400 })
    }

    const forwardedFor = request.headers.get("x-forwarded-for")
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown"
    try {
      await Promise.all([
        apiLimiter.check(3, `otp-send:ip:${ip}`),
        apiLimiter.check(3, `otp-send:phone:${normalizedPhone}`),
      ])
    } catch {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      )
    }

    const { error } = await supabasePublic.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      console.error("[auth/send-otp] provider rejected OTP request:", error.message)
      return NextResponse.json({ error: "Unable to send OTP right now." }, { status: 503 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to send OTP" }, { status: 500 })
  }
}
