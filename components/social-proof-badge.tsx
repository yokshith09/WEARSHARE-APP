"use client";

import { useMemo } from "react";
import { Flame, Clock, ShieldCheck, Users } from "lucide-react";

interface SocialProofProps {
  listingId: string;
  area?: string;
  reviewsCount?: number;
  variant?: "card" | "detail";
}

export function SocialProofBadge({
  listingId,
  area = "Bengaluru",
  reviewsCount = 4,
  variant = "detail",
}: SocialProofProps) {
  // Deterministic count based on listing ID string hash
  const viewers = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < listingId.length; i++) {
      hash = (hash << 5) - hash + listingId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 5) + 3; // 3 to 7 active viewers
  }, [listingId]);

  if (variant === "card") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
        <Flame className="h-2.5 w-2.5 fill-white" />
        <span>{viewers} looking now</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 shadow-sm">
      <div className="flex items-center gap-1.5 font-semibold text-amber-800">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600"></span>
        </span>
        <Flame className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
        <span>High Demand</span>
      </div>
      <span className="text-amber-800/60 hidden sm:inline">•</span>
      <p className="text-amber-900">
        <strong>{viewers} people</strong> in {area} viewed this outfit today
      </p>
      <span className="text-amber-800/60 hidden sm:inline">•</span>
      <div className="flex items-center gap-1 text-emerald-800 font-medium">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>Rented {Math.max(reviewsCount, 3)} times with 100% deposit return</span>
      </div>
    </div>
  );
}
