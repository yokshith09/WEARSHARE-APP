import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { apiLimiter } from "@/lib/rate-limit";
import { sendEmail, wearShareEmailShell } from "@/lib/resend-email";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
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

    await apiLimiter.check(3, `password-reset:${ip}`);

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.from("reset_tokens").insert({
      email: normalizedEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (error) throw error;

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendEmail(
      normalizedEmail,
      "Reset your WearShare password",
      wearShareEmailShell(`
        <h2 style="font-size:22px;margin:0 0 12px">Reset your password</h2>
        <p>Use this secure link to reset your WearShare password. It expires in 30 minutes.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#151512;color:#fff;padding:12px 18px;text-decoration:none">Reset password</a></p>
      `)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[password/request-reset]", error);
    return NextResponse.json({ error: error?.message || "Unable to request password reset" }, { status: 500 });
  }
}

