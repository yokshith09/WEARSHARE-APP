import { embedText } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";

const LISTING_SEARCH_TRIGGERS = [
  "lehenga",
  "saree",
  "sherwani",
  "gown",
  "dress",
  "kurta",
  "suit",
  "outfit",
  "wedding",
  "party",
  "formal",
  "festival",
  "find",
  "search",
  "show",
  "rent",
  "size",
  "price",
  "budget",
  "men",
  "women",
];

export function requiresListingSearch(message: string) {
  const lower = message.toLowerCase();
  return LISTING_SEARCH_TRIGGERS.some((trigger) => lower.includes(trigger));
}

export async function loadChatHistory(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    console.error("[RAG] loadChatHistory error:", error);
    return [];
  }

  return (data || []).map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));
}

export async function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  userId?: string
) {
  const { error } = await supabaseAdmin.from("chat_sessions").insert({
    session_id: sessionId,
    user_id: userId || null,
    role,
    content,
  });
  if (error) {
    console.error("[RAG] saveChatMessage error:", error);
  }
}

export async function retrieveRelevantListings(
  query: string,
  options?: { matchCount?: number }
) {
  const matchCount = options?.matchCount || 5;
  const embedding = await embedText(query);

  const { data: matches, error: matchError } = await supabaseAdmin.rpc("match_listings", {
    query_embedding: embedding,
    match_count: matchCount,
  });

  if (matchError) {
    console.error("[RAG] match_listings error:", matchError);
    return [];
  }

  const listingIds = (matches || []).map((row: any) => row.listing_id);
  if (!listingIds.length) return [];

  const { data: listings, error: listingError } = await supabaseAdmin
    .from("listings")
    .select(`
      id,
      title,
      category,
      occasion,
      size,
      condition,
      rental_price_per_day,
      security_deposit,
      available,
      users!owner_id (name, rating, is_verified)
    `)
    .in("id", listingIds);

  if (listingError) {
    console.error("[RAG] listing fetch error:", listingError);
    return [];
  }

  const rank = new Map(listingIds.map((id: string, index: number) => [id, index]));

  return (listings || [])
    .map((listing: any) => {
      const owner = Array.isArray(listing.users) ? listing.users[0] : listing.users;
      return {
        listing_id: listing.id,
        title: listing.title,
        category: listing.category,
        occasion: listing.occasion,
        size: listing.size,
        condition: listing.condition,
        rent_per_day: Number(listing.rental_price_per_day || 0),
        deposit_amount: Number(listing.security_deposit || 0),
        lister_name: owner?.name || "WearShare Lister",
        lister_rating: Number(owner?.rating || 0),
        is_verified: !!owner?.is_verified,
      };
    })
    .sort((a, b) => {
      const aRank = Number(rank.get(a.listing_id) ?? 999);
      const bRank = Number(rank.get(b.listing_id) ?? 999);
      return aRank - bRank;
    });
}

export function formatListingContext(listings: any[]) {
  if (!listings.length) return "";
  return `\n\nRELEVANT LISTINGS:\n${listings
    .map(
      (l, i) =>
        `${i + 1}. "${l.title}" — ₹${Math.round(l.rent_per_day)}/day, Size ${l.size}, ${String(
          l.condition || ""
        ).replace("_", " ")}, Deposit ₹${Math.round(l.deposit_amount)}, ${l.lister_name} (${l.is_verified ? "Verified ✓" : "Unverified"}), Rating ${l.lister_rating}`
    )
    .join("\n")}\n\nReference these listings when relevant.`;
}

export function wearshareSystemPrompt(listings: any[]) {
  return `You are Wren, WearShare's fashion rental AI assistant for Bengaluru, India.
WearShare is a peer-to-peer clothing rental marketplace.

PLATFORM RULES:
- Rentals are priced per day.
- Security deposit is refundable after confirmed return.
- Damage claims need photo evidence.
- Users cannot rent their own listed items.

STYLE:
- Warm, fashion-forward, concise.
- Use ₹ for prices.
- Keep normal answers to 2-4 short sentences.
- If listings are provided, mention the best options clearly.
${formatListingContext(listings)}`;
}
