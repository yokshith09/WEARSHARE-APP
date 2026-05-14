"use client";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-border bg-ink text-cream">
      <div className="container-edit grid gap-12 py-14 md:grid-cols-4 md:py-16">
        <div className="md:col-span-2">
          <div className="font-display text-3xl text-cream">
            Wear<span className="italic text-primary">Share</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/66">
            India's neighbourhood wardrobe. Rent premium outfits from people next door,
            and earn from the clothes already in your closet.
          </p>
          <p className="eyebrow mt-6 text-cream/50">Now in</p>
          <p className="text-sm text-cream">Bengaluru / Mumbai Q2 / Delhi NCR Q3</p>
        </div>
        <div>
          <p className="eyebrow mb-4 text-cream/50">Discover</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/browse" className="text-cream/76 hover:text-primary">Browse outfits</Link></li>
            <li><Link href="/how-it-works" className="text-cream/76 hover:text-primary">How it works</Link></li>
            <li><Link href="/community" className="text-cream/76 hover:text-primary">Community</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-cream/50">Earn</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/list-item" className="text-cream/76 hover:text-primary">List your wardrobe</Link></li>
            <li><Link href="/how-it-works" className="text-cream/76 hover:text-primary">Trust & safety</Link></li>
            <li><Link href="/how-it-works" className="text-cream/76 hover:text-primary">Damage protection</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-edit flex flex-col justify-between gap-3 py-6 text-xs text-cream/50 md:flex-row">
          <p>© {new Date().getFullYear()} WearShare. Made with care in Bengaluru.</p>
          <p>Privacy / Terms / Damage policy</p>
        </div>
      </div>
    </footer>
  );
}
