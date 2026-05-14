"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, Zap, Info, Check } from "lucide-react";
import { format, addDays } from "date-fns";
import { getListing, inr } from "@/lib/listings";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function BookingConfirm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const listing = useMemo(() => getListing(id), [id]);

  if (!listing) {
    return (
      <div className="container-edit py-32 text-center">
        <p className="font-display text-3xl">Outfit not found</p>
        <Link href="/browse" className="mt-6 inline-block text-primary underline">Back to browse</Link>
      </div>
    );
  }

  const daysStr = searchParams.get("days");
  const days = daysStr ? parseInt(daysStr) : 2;
  const fromStr = searchParams.get("from");
  const from = fromStr ? new Date(fromStr) : addDays(new Date(), 4);
  const toStr = searchParams.get("to");
  const to = toStr ? new Date(toStr) : addDays(from, days - 1);

  const subtotal = days * listing.pricePerDay;
  const protectionFee = Math.round(subtotal * 0.05);
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + protectionFee + serviceFee;

  const [ack, setAck] = useState({ care: false, deposit: false, terms: false });
  const allOk = ack.care && ack.deposit && ack.terms;

  const confirm = () => {
    if (!allOk) return;
    router.push(`/trips/${listing.id}`);
  };

  const acknowledgements = useMemo(
    () => [
      {
        key: "care" as const,
        title: "Reasonable care",
        body: "I'll treat this piece as my own - no smoking, no harsh stains, dry-clean only if required.",
      },
      {
        key: "deposit" as const,
        title: `Refundable deposit ${inr(listing.deposit)}`,
        body: "Held by WearShare and released within 24h of return if no damage is reported.",
      },
      {
        key: "terms" as const,
        title: "Damage policy",
        body: "Minor wear is covered. Major damage is mediated by WearShare with photo evidence from both sides.",
      },
    ],
    [listing.deposit],
  );

  return (
    <div className="bg-background">
      <div className="container-edit pt-8">
        <Link href={`/listing/${listing.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to listing
        </Link>
      </div>

      <section className="container-edit pt-6 pb-20 grid md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-7 space-y-10">
          <div>
            <p className="eyebrow flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> Instant booking</p>
            <h1 className="font-display text-4xl md:text-5xl mt-3 text-ink leading-tight">Confirm your rental</h1>
            <p className="mt-3 text-muted-foreground max-w-md text-sm">
              One last check before payment. Your card is only charged once {listing.lister.split(" ")[0]} approves - usually within an hour.
            </p>
          </div>

          {/* Deposit + protection breakdown */}
          <div className="border border-border">
            <div className="px-5 py-4 hairline-0 bg-secondary/40 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm text-ink font-medium">Damage deposit & wear-and-tear protection</p>
            </div>
            <div className="divide-y divide-border text-sm">
              <Row label="Refundable security deposit" value={inr(listing.deposit)} note="Held in escrow. Released 24h post-return." />
              <Row label="Protection fee (5%)" value={inr(protectionFee)} note="Covers minor wear, loose threads, light stains." />
              <Row label="Service fee (8%)" value={inr(serviceFee)} note="Pickup coordination, dispute mediation." />
              <Row label="Major damage" value="Renter pays repair cost" note="Mediated using photos from both parties before deposit release." />
            </div>
            <div className="px-5 py-4 bg-secondary/30 flex gap-2 text-[12px] text-muted-foreground">
              <span className="h-3.5 w-3.5 shrink-0 mt-0.5">i</span>
              <p>What counts as wear & tear vs damage is documented in our care guide. Listers and renters both photograph the item at handover.</p>
            </div>
          </div>

          {/* Acknowledgements */}
          <div className="space-y-3">
            <p className="eyebrow">Please acknowledge</p>
            {acknowledgements.map((a) => (
              <label
                key={a.key}
                className={`flex gap-3 border p-4 cursor-pointer transition-colors ${
                  ack[a.key] ? "border-primary bg-primary/5" : "border-border hover:border-ink/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={ack[a.key]}
                  onChange={(e) => setAck((s) => ({ ...s, [a.key]: e.target.checked }))}
                  className="mt-1 accent-[var(--primary)]"
                />
                <div>
                  <p className="text-sm text-ink font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.body}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Sticky summary */}
        <aside className="md:col-span-5 md:sticky md:top-28 md:self-start">
          <div className="border border-border">
            <div className="flex gap-4 p-5 hairline-0">
              <div className="h-24 w-20 overflow-hidden bg-muted shrink-0">
                <img src={listing.image} alt={listing.title} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="eyebrow">{listing.occasion}</p>
                <p className="font-display text-lg text-ink mt-1 leading-tight">{listing.title}</p>
                <p className="text-xs text-muted-foreground mt-1">From {listing.lister} / {listing.area}</p>
              </div>
            </div>
            <div className="border-t border-border px-5 py-4 grid grid-cols-3 text-xs">
              <div>
                <p className="eyebrow">Pickup</p>
                <p className="text-ink mt-1">{format(from, "d MMM")}</p>
              </div>
              <div>
                <p className="eyebrow">Return</p>
                <p className="text-ink mt-1">{format(to, "d MMM")}</p>
              </div>
              <div>
                <p className="eyebrow">Days</p>
                <p className="text-ink mt-1">{days}</p>
              </div>
            </div>
            <div className="border-t border-border px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{inr(listing.pricePerDay)} x {days}</span><span className="text-ink">{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Protection</span><span className="text-ink">{inr(protectionFee)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="text-ink">{inr(serviceFee)}</span></div>
              <div className="flex justify-between hairline pt-3 mt-2"><span className="text-ink font-medium">Total today</span><span className="font-display text-lg text-ink">{inr(total)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>+ Refundable deposit</span><span>{inr(listing.deposit)}</span></div>
            </div>

            <button
              disabled={!allOk}
              onClick={confirm}
              className="w-full bg-ink text-cream py-4 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              {allOk ? `Confirm & pay ${inr(total)}` : "Acknowledge to continue"}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground text-center">
            By confirming you agree to the WearShare rental terms.
          </p>
        </aside>
      </section>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-6">
      <div>
        <p className="text-ink">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{note}</p>
      </div>
      <p className="text-ink font-medium whitespace-nowrap">{value}</p>
    </div>
  );
}
