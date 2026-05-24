"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "home_final_cta" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to join waitlist");
      trackEvent("waitlist_signup", { source: "home_final_cta" });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={submit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="your@email.in"
        className="flex-1 bg-transparent border border-ink px-4 py-3 text-sm focus:outline-none focus:border-primary rounded-lg"
        required
      />
      <button type="submit" disabled={status === "loading"} className="bg-ink text-cream px-6 py-3 text-sm font-medium hover:bg-primary transition-colors rounded-lg disabled:opacity-60">
        {status === "loading" ? "Joining..." : status === "success" ? "You're in" : "Notify me"}
      </button>
      {status === "error" && <p className="sm:col-span-2 text-xs text-red-600">Could not join right now. Try again in a moment.</p>}
    </form>
  );
}
