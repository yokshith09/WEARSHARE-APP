import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase";
import { apiLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  try {
    await apiLimiter.check(10, `claims:${userId || ip}`);
  } catch {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { bookingId, listingId, issueType, notes, photos = [] } = body;

    if (!issueType || !notes || !notes.trim()) {
      return NextResponse.json({ error: "Issue type and detailed description are required." }, { status: 400 });
    }

    // Resolve or verify booking
    let resolvedBookingId = bookingId;
    if (!resolvedBookingId && listingId) {
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("listing_id", listingId)
        .eq("renter_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      resolvedBookingId = booking?.id;
    }

    if (!resolvedBookingId) {
      // Find latest booking associated with this user if listing not supplied
      const { data: anyBooking } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .or(`renter_id.eq.${userId},lender_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      resolvedBookingId = anyBooking?.id;
    }

    if (!resolvedBookingId) {
      return NextResponse.json({ error: "No active booking found to link this claim." }, { status: 400 });
    }

    const { data: claim, error: insertError } = await supabaseAdmin
      .from("claims")
      .insert({
        booking_id: resolvedBookingId,
        claimant_id: userId,
        issue_type: issueType,
        notes: notes.trim(),
        photos: Array.isArray(photos) ? photos.slice(0, 6) : [],
        status: "submitted",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Claims API] Insert error:", insertError);
      return NextResponse.json({ error: "Unable to submit claim. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, claimId: claim.id }, { status: 201 });
  } catch (error: any) {
    console.error("[Claims API] Exception:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { data: claims, error } = await supabaseAdmin
      .from("claims")
      .select("*, bookings(*, listings(*))")
      .eq("claimant_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ claims: claims || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch claims" }, { status: 500 });
  }
}
