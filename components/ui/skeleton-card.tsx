"use client";

/**
 * Skeleton loader card matching ListingCard dimensions.
 * Uses a CSS shimmer animation — zero dependencies.
 */
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      <div className="pt-4 px-1 space-y-2">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-1/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
