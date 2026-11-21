"use client";

import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Try adjusting your filters or check back later.",
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
        {icon || <PackageOpen className="h-9 w-9" />}
      </div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-6 text-xs px-5 py-2.5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
