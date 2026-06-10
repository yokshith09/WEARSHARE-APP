import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";
import { supabaseAdmin } from "@/lib/supabase";

type SecuritySeverity = "info" | "warning" | "critical";

type SecurityEvent = {
  eventType: string;
  severity?: SecuritySeverity;
  actorId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

function hashValue(value?: string | null) {
  if (!value) return null;
  const secret = process.env.SECURITY_LOG_HASH_SECRET || process.env.NEXTAUTH_SECRET || "";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function getRequestContext(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return {
    ip: forwardedFor?.split(",")[0]?.trim() || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}

export async function recordSecurityEvent({
  eventType,
  severity = "info",
  actorId = null,
  ip = null,
  userAgent = null,
  metadata = {},
}: SecurityEvent) {
  try {
    const { error } = await supabaseAdmin.from("security_events").insert({
      event_type: eventType,
      severity,
      actor_id: actorId,
      ip_hash: hashValue(ip),
      user_agent_hash: hashValue(userAgent),
      metadata,
    });

    if (error) {
      console.error("[security-event] database write failed:", error.message);
    }
  } catch (error) {
    console.error("[security-event] database write failed:", error);
  }

  if (severity === "warning" || severity === "critical") {
    Sentry.captureMessage(`Security event: ${eventType}`, {
      level: severity === "critical" ? "error" : "warning",
      tags: {
        security_event: eventType,
        security_severity: severity,
      },
      extra: {
        actorId,
        ...metadata,
      },
    });
  }
}
