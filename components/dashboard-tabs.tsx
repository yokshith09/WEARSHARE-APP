"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 border-b border-border mb-8">
      <Link
        href="/dashboard/renter"
        className={`pb-4 text-sm font-semibold transition-colors relative ${
          pathname.includes("/dashboard/renter") ? "text-primary" : "text-muted-foreground hover:text-ink"
        }`}
      >
        Renter Dashboard
        {pathname.includes("/dashboard/renter") && (
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-md" />
        )}
      </Link>
      <Link
        href="/dashboard/lister"
        className={`pb-4 text-sm font-semibold transition-colors relative ${
          pathname.includes("/dashboard/lister") ? "text-primary" : "text-muted-foreground hover:text-ink"
        }`}
      >
        Lister Dashboard
        {pathname.includes("/dashboard/lister") && (
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-md" />
        )}
      </Link>
    </div>
  );
}
