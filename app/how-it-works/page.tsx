"use client";
import Link from "next/link";

import { Search, Calendar, Truck, RotateCcw, ShieldCheck, Star } from "lucide-react";



export default function HowItWorks() {
  return (
    <div className="bg-background">
      <section className="container-edit pt-14 md:pt-20 pb-16 max-w-4xl">
        <p className="eyebrow">The full process</p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[1] mt-4 text-ink">
          Built on trust between<br /><span className="italic text-primary">neighbours.</span>
        </h1>
        <p className="mt-7 text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Every rental is request-first, deposit-protected, and reviewed on both sides. Here's exactly how
          a piece moves from one wardrobe to another and back again.
        </p>
      </section>

      <section className="container-edit pb-24">
        <div className="space-y-px">
          {[
            { n: "01", icon: Search, t: "Discover", d: "Filter by occasion, size, distance, price and the date you need it. Every photo is editorial-quality and uploaded by the actual owner - no stock images." },
            { n: "02", icon: Calendar, t: "Request the dates", d: "Pick pickup and return dates from the live calendar. Pay rental + refundable deposit through UPI. Lister has 48 hours to confirm." },
            { n: "03", icon: Truck, t: "Pickup or delivery", d: "Most exchanges happen within 5km. Choose self-pickup at the lister's preferred spot, or scheduled delivery for a small fee." },
            { n: "04", icon: Star, t: "Wear with confidence", d: "Every listing carries a fit confidence score based on the lister's measurements vs your saved profile. Damage cover starts the moment you receive it." },
            { n: "05", icon: RotateCcw, t: "Return cleaned", d: "Drop the outfit dry-cleaned at the agreed return point. We share a return checklist over WhatsApp the night before." },
            { n: "06", icon: ShieldCheck, t: "Deposit released", d: "Both sides confirm condition. Deposit released to your UPI within 24 hours. Both sides leave a public review." },
          ].map(({ n, icon: Icon, t, d }, i) => (
            <div key={n} className="grid md:grid-cols-12 gap-6 py-10 border-t border-border first:border-t-0">
              <div className="md:col-span-2 flex md:flex-col items-baseline md:items-start gap-3">
                <span className="font-display text-5xl italic text-primary leading-none">{n}</span>
                <Icon className="h-5 w-5 text-ink mt-2" />
              </div>
              <div className="md:col-span-4">
                <h2 className="font-display text-3xl text-ink leading-tight">{t}</h2>
              </div>
              <div className="md:col-span-6">
                <p className="text-base text-muted-foreground leading-relaxed">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="container-edit py-24 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <p className="eyebrow text-cream/60">Damage policy</p>
            <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">
              When something goes wrong,<br /><span className="italic text-primary">a real human steps in.</span>
            </h2>
            <p className="mt-6 text-cream/70 max-w-xl leading-relaxed">
              Photo evidence from both sides. A trained moderator. A 48-hour decision window. Deposits are
              held in escrow - no awkward chats, no chasing.
            </p>
          </div>
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            {[
              ["48h", "Mediation SLA"],
              ["100%", "Deposit escrow"],
              ["₹0", "Disputes carried forward"],
              ["4.2 star", "Avg rental rating"],
            ].map(([n, l]) => (
              <div key={l} className="border border-cream/15 p-5">
                <p className="font-display text-3xl text-cream">{n}</p>
                <p className="text-xs text-cream/60 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-edit py-24 text-center">
        <h2 className="font-display text-4xl md:text-5xl text-ink leading-tight">Ready to begin?</h2>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link href="/browse" className="bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-primary transition-colors">Browse outfits</Link>
          <Link href="/list-item" className="border border-ink text-ink px-6 py-3.5 text-sm font-medium hover:bg-ink hover:text-cream transition-colors">List your wardrobe</Link>
        </div>
      </section>
    </div>
  );
}
