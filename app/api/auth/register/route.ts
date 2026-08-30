import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { apiLimiter } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-events";

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    try {
      await apiLimiter.check(10, `register:ip:${ip}`);
    } catch {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim() || email.split("@")[0];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from("users")
      .select("id, name, email, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("[register] user lookup error:", lookupError);
      return NextResponse.json(
        { error: "Database service unavailable. Please try again shortly." },
        { status: 500 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (existingUser) {
      if (existingUser.password_hash) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        );
      }

      // User exists without password (e.g. created via OTP) - set password
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          name: name || existingUser.name,
          password_hash: passwordHash,
          is_verified: true,
          email_verified: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id);

      if (updateError) {
        console.error("[register] user update error:", updateError);
        return NextResponse.json(
          { error: "Could not set up account credentials. Please try again." },
          { status: 500 }
        );
      }

      await recordSecurityEvent({
        eventType: "auth.register.password_set",
        actorId: existingUser.id,
        ip,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: "Account updated with password. You can now sign in.",
        userId: existingUser.id,
      });
    }

    // Create brand new user
    const userId = randomUUID();
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email,
        name,
        password_hash: passwordHash,
        is_verified: true,
        email_verified: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[register] user insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    await recordSecurityEvent({
      eventType: "auth.register.success",
      actorId: userId,
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
      userId,
    });
  } catch (err: any) {
    console.error("[register] unexpected error:", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
