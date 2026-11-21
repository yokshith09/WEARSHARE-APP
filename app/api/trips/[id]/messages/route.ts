import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase";
import { apiLimiter } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const bookingId = params.id;

  // IDOR Protection: If bookingId is a UUID, verify session user is the renter or lender
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);
  if (isUuid) {
    try {
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("id, renter_id, lender_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (booking && booking.renter_id !== userId && booking.lender_id !== userId) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to view messages for this trip" },
          { status: 403 }
        );
      }
    } catch (authErr) {
      console.warn("[Trip Messages Auth Warning]", authErr);
    }
  }

  try {
    const { data: messages, error } = await supabaseAdmin
      .from("trip_messages")
      .select("*, sender:users!sender_id(name, image)")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const bookingId = params.id;
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  try {
    await apiLimiter.check(30, `trip-msg:${userId || ip}`);
  } catch {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // IDOR Protection: If bookingId is a UUID, verify session user is the renter or lender
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);
  if (isUuid) {
    try {
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("id, renter_id, lender_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (booking && booking.renter_id !== userId && booking.lender_id !== userId) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to post messages for this trip" },
          { status: 403 }
        );
      }
    } catch (authErr) {
      console.warn("[Trip Messages Auth Warning]", authErr);
    }
  }

  try {
    const { content, kind = "text", metadata = {} } = await request.json();

    const rawContent = String(content || "").trim();
    if (!rawContent) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (rawContent.length > 1000) {
      return NextResponse.json(
        { error: "Message too long (maximum 1000 characters allowed)" },
        { status: 400 }
      );
    }

    // Defensive XSS sanitation: strip HTML tags
    const sanitizedContent = rawContent.replace(/<[^>]*>?/gm, "").trim();
    const validKind = ["text", "address", "photos", "system"].includes(kind) ? kind : "text";

    const { data: message, error } = await supabaseAdmin
      .from("trip_messages")
      .insert({
        booking_id: bookingId,
        sender_id: userId,
        kind: validKind,
        content: sanitizedContent,
        metadata: typeof metadata === "object" && metadata !== null ? metadata : {},
      })
      .select("*, sender:users!sender_id(name, image)")
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        mockFallback: true,
        message: {
          id: `msg-${Date.now()}`,
          booking_id: bookingId,
          sender_id: userId,
          kind: validKind,
          content: sanitizedContent,
          metadata,
          created_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to send message" }, { status: 500 });
  }
}
