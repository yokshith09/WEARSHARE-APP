import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { apiLimiter } from "@/lib/rate-limit";
import { sendEmail, wearShareEmailShell } from "@/lib/resend-email";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const normalizedEmail = normalizeEmail(email);
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    try {
      await Promise.all([
        apiLimiter.check(3, `email-otp:ip:${ip}`),
        apiLimiter.check(3, `email-otp:email:${normalizedEmail}`),
      ]);
    } catch {
      return NextResponse.json({ error: "Too many OTP requests. Please try again later." }, { status: 429 });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from("email_otps").insert({
      email: normalizedEmail,
      otp_hash: otpHash,
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    await sendEmail(
      normalizedEmail,
      "Verify your WearShare account",
      wearShareEmailShell(`
        <h2 style="font-size:22px;margin:0 0 12px">Your WearShare OTP</h2>
        <p>Use this code to sign in:</p>
        <p style="font-size:32px;letter-spacing:6px;font-weight:700;margin:18px 0">${otp}</p>
        <p>This code is valid for 5 minutes.</p>
      `)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[email/send-otp]", error);
    return NextResponse.json({ error: error?.message || "Unable to send email OTP" }, { status: 500 });
  }
}

