import { NextRequest, NextResponse } from "next/server";
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

    await apiLimiter.check(5, `newsletter:${ip}`);

    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert({ email: normalizedEmail }, { onConflict: "email" });

    if (error) throw error;

    await sendEmail(
      normalizedEmail,
      "Welcome to WearShare updates",
      wearShareEmailShell(`
        <h2 style="font-size:22px;margin:0 0 12px">You're on the WearShare list</h2>
        <p>We will send product updates, new city launches, and rental tips here.</p>
      `)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[newsletter]", error);
    return NextResponse.json({ error: error?.message || "Unable to subscribe" }, { status: 500 });
  }
}

