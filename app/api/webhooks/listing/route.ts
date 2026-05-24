import { NextRequest, NextResponse } from "next/server";
import { embedText } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";

function buildEmbeddableText(listing: Record<string, any>) {
  return [
    listing.title,
    listing.description,
    listing.category ? `Category: ${listing.category}` : "",
    listing.occasion ? `Occasion: ${listing.occasion}` : "",
    listing.size ? `Size: ${listing.size}` : "",
    listing.condition ? `Condition: ${listing.condition}` : "",
    `Rental price: ₹${Math.round(Number(listing.rentalPricePerDay || listing.rental_price_per_day || 0))} per day`,
    `Security deposit: ₹${Math.round(Number(listing.securityDeposit || listing.security_deposit || 0))}`,
    listing.area ? `Area: ${listing.area}` : "",
    listing.pincode ? `Pincode: ${listing.pincode}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, listing } = await req.json();
  const mongoId = listing?._id?.toString();
  if (!mongoId) {
    return NextResponse.json({ error: "listing._id is required" }, { status: 400 });
  }

  try {
    if (type === "deleted") {
      const { data: row } = await supabaseAdmin
        .from("listings")
        .select("id")
        .eq("mongo_id", mongoId)
        .maybeSingle();
      if (row?.id) {
        await supabaseAdmin.from("listing_embeddings").delete().eq("listing_id", row.id);
        await supabaseAdmin.from("listings").delete().eq("id", row.id);
      }
      return NextResponse.json({ success: true, action: "deleted" });
    }

    const listingData: any = {
      mongo_id: mongoId,
      title: listing.title || "Untitled outfit",
      description: listing.description || null,
      category: listing.category || "women",
      occasion: listing.occasion || null,
      size: listing.size || "M",
      condition: listing.condition || "good",
      rental_price_per_day: Number(listing.rentPerDay || listing.rentalPricePerDay || 0),
      security_deposit: Number(listing.depositAmount || listing.securityDeposit || 0),
      pincode: listing.pincode || null,
      area: listing.city || listing.area || "Bengaluru",
      available: listing.isAvailable !== false,
      image_url: Array.isArray(listing.photos) && listing.photos.length ? listing.photos[0] : null,
      photo_urls: Array.isArray(listing.photos) ? listing.photos : [],
    };

    const { data: upserted, error: upErr } = await supabaseAdmin
      .from("listings")
      .upsert(listingData, { onConflict: "mongo_id" })
      .select("id")
      .single();

    if (upErr) throw upErr;

    const content = buildEmbeddableText(listingData);
    const embedding = await embedText(content);
    const { error: embedErr } = await supabaseAdmin.from("listing_embeddings").upsert(
      { listing_id: upserted.id, content, embedding },
      { onConflict: "listing_id" }
    );
    if (embedErr) throw embedErr;

    return NextResponse.json({ success: true, action: type || "upsert", listingId: upserted.id });
  } catch (error: any) {
    console.error("[Webhook/listing] error:", error);
    return NextResponse.json({ error: error?.message || "Webhook sync failed" }, { status: 500 });
  }
}

