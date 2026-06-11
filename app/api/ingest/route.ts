import { NextRequest, NextResponse } from "next/server";
import { embedText } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 120;

function buildEmbeddableText(listing: Record<string, any>) {
  return [
    listing.title,
    listing.description,
    listing.category ? `Category: ${listing.category}` : "",
    listing.occasion ? `Occasion: ${listing.occasion}` : "",
    listing.size ? `Size: ${listing.size}` : "",
    listing.condition ? `Condition: ${listing.condition}` : "",
    `Rental price: Rs ${Math.round(Number(listing.rental_price_per_day || 0))} per day`,
    `Security deposit: Rs ${Math.round(Number(listing.security_deposit || 0))}`,
    listing.city ? `City: ${listing.city}` : "",
    listing.area ? `Area: ${listing.area}` : "",
    listing.pincode ? `Pincode: ${listing.pincode}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export async function POST(req: NextRequest) {
  const expected = process.env.INGEST_SECRET;
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: listings, error } = await supabaseAdmin
    .from("listings")
    .select("id,title,description,category,occasion,size,condition,rental_price_per_day,security_deposit,city,area,pincode")
    .eq("available", true)
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let ingested = 0;
  const errors: string[] = [];

  for (const listing of listings || []) {
    try {
      const content = buildEmbeddableText(listing);
      const embedding = await embedText(content);
      const { error: upsertError } = await supabaseAdmin.from("listing_embeddings").upsert(
        {
          listing_id: listing.id,
          content,
          embedding,
        },
        { onConflict: "listing_id" }
      );
      if (upsertError) throw upsertError;
      ingested += 1;
    } catch (e: any) {
      errors.push(`${listing.id}: ${e?.message || "Unknown error"}`);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    total: listings?.length || 0,
    ingested,
    errors,
  });
}

