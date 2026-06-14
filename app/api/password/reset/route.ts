import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { apiLimiter } from "@/lib/rate-limit";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json();
    const normalizedEmail = normalizeEmail(email);
    const resetToken = String(token || "");
    const newPassword = String(password || "");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !resetToken || newPassword.length < 8) {
      return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
    }

    await apiLimiter.check(5, `password-reset-confirm:${ip}`);

    const { data: rows, error } = await supabaseAdmin
      .from("reset_tokens")
      .select("id,token_hash,expires_at")
      .eq("email", normalizedEmail)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    let matchedRow: { id: string; token_hash: string; expires_at: string } | undefined;
    for (const row of rows || []) {
      if (new Date(row.expires_at).getTime() < Date.now()) continue;
      if (await bcrypt.compare(resetToken, row.token_hash)) {
        matchedRow = row;
        break;
      }
    }

    if (!matchedRow) {
      return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", normalizedEmail)
      .select("id")
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    await supabaseAdmin
      .from("reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", matchedRow.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[password/reset]", error);
    return NextResponse.json({ error: error?.message || "Unable to reset password" }, { status: 500 });
  }
}
