import { NextRequest, NextResponse } from "next/server";

const rateMap = new Map<string, { count: number; resetAt: number }>();

function hitLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count += 1;
  return false;
}

function withCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  const allowed = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const normalizedOrigin = origin.replace(/\/$/, "");
  if (origin && allowed.includes(normalizedOrigin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,x-webhook-secret");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    return withCors(req, new NextResponse(null, { status: 204 }));
  }

  if (pathname.startsWith("/api/chat")) {
    if (hitLimit(`chat:${ip}`, 25, 60_000)) {
      return withCors(
        req,
        NextResponse.json({ error: "Too many requests. Please wait and retry." }, { status: 429 })
      );
    }
  }

  if (pathname.startsWith("/api/ingest") || pathname.startsWith("/api/webhooks/listing")) {
    if (hitLimit(`ingest:${ip}`, 10, 60_000)) {
      return withCors(
        req,
        NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 })
      );
    }
  }

  return withCors(req, NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};
