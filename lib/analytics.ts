"use client";

import posthog from "posthog-js";

let initialized = false;

export type AnalyticsEvent =
  | "listing_viewed"
  | "filter_changed"
  | "zero_results"
  | "add_to_cart"
  | "booking_started"
  | "booking_completed"
  | "listing_created"
  | "waitlist_signup";

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: true,
    person_profiles: "identified_only",
  });

  initialized = true;
}

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  initAnalytics();
  if (!initialized) return;
  posthog.capture(event, properties);
}
