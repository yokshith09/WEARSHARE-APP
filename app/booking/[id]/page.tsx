"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, Zap, Check, Lock } from "lucide-react";
import { format, addDays } from "date-fns";
import { inr } from "@/lib/listings";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";

export default function BookingConfirm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setListing(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const daysStr = searchParams.get("days");
  const days = daysStr ? parseInt(daysStr) : 2;
  const fromStr = searchParams.get("from");
  const from = fromStr ? new Date(fromStr) : addDays(new Date(), 4);
  const toStr = searchParams.get("to");
  const to = toStr ? new Date(toStr) : addDays(from, days - 1);

  const price = listing?.rentalPricePerDay || listing?.pricePerDay || 0;
  const depositAmt = listing?.securityDeposit || listing?.deposit || 0;
  const subtotal = days * price;
  const protectionFee = Math.round(subtotal * 0.05);
  const total = subtotal + protectionFee + depositAmt;

  const [ack, setAck] = useState({ care: false, deposit: false, terms: false });
  const allOk = ack.care && ack.deposit && ack.terms;

  const handlePayment = async () => {
    if (!allOk || !listing) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rentalStart: from.toISOString(),
          listingId: listing._id || listing.id,
          days: days
        }),
      });

      const orderData = await res.json();

      if (orderData.error) {
        alert(orderData.error);
        setProcessing(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "WearShare",
        description: `Rent ${listing.name || listing.title}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const confirmRes = await fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              rentalStart: orderData.rentalStart,
              listingId: listing._id || listing.id,
              days: days
            }),
          });

          const confirmData = await confirmRes.json();
          if (confirmData.success) {
            router.push("/dashboard?checkout=success");
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#9333EA",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const acknowledgements = [
    {
      key: "care" as const,
      title: "Reasonable care",
      body: "I'll treat this piece as my own - no smoking, no harsh stains, dry-clean only if required.",
    },
    {
      key: "deposit" as const,
      title: `Refundable deposit ${inr(depositAmt)}`,
      body: "Held by WearShare and released within 24h of return if no damage is reported.",
    },
    {
      key: "terms" as const,
      title: "Damage policy",
      body: "Minor wear is covered. Major damage is mediated by WearShare with photo evidence from both sides.",
    },
  ];

  if (loading) {
    return <div className="container-edit py-32 text-center text-muted-foreground">Loading booking details...</div>;
  }

  if (!listing) {
    return (
      <div className="container-edit py-32 text-center">
        <p className="font-display text-3xl">Outfit not found</p>
        <Link href="/browse" className="mt-6 inline-block text-primary underline">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="container-edit pt-8">
        <Link href={`/listing/${id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to listing
        </Link>
      </div>

      <section className="container-edit pt-6 pb-20 grid md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-7 space-y-10">
          <div>
            <p className="eyebrow flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> Instant booking</p>
            <h1 className="font-display text-4xl md:text-5xl mt-3 text-ink leading-tight">Confirm your rental</h1>
            <p className="mt-3 text-muted-foreground max-w-md text-sm">
              One last check before payment. Your booking is confirmed instantly once the payment is successful.
            </p>
          </div>

          <div className="border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-secondary/40 flex items-center gap-2 border-b border-border">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm text-ink font-medium">Damage deposit & protection</p>
            </div>
            <div className="divide-y divide-border text-sm bg-white">
              <Row label="Refundable security deposit" value={inr(depositAmt)} note="Held in escrow. Released 24h post-return." />
              <Row label="Protection fee (5%)" value={inr(protectionFee)} note="Covers minor wear, loose threads, light stains." />
              <Row label="Major damage" value="Renter pays repair cost" note="Mediated using photos from both parties." />
            </div>
          </div>

          <div className="space-y-3">
            <p className="eyebrow">Please acknowledge</p>
            {acknowledgements.map((a) => (
              <label
                key={a.key}
                className={`flex gap-3 border p-4 rounded-xl cursor-pointer transition-colors ${
                  ack[a.key as keyof typeof ack] ? "border-primary bg-primary/5" : "border-border hover:border-ink/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={ack[a.key as keyof typeof ack]}
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

        <aside className="md:col-span-5 md:sticky md:top-28 md:self-start">
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-lg">
            <div className="flex gap-4 p-5 border-b border-border">
              <div className="h-24 w-20 overflow-hidden rounded-lg bg-muted shrink-0">
                <img src={listing.imageUrl || listing.imageData || listing.image} alt={listing.name || listing.title} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="eyebrow">{listing.category || listing.occasion}</p>
                <p className="font-display text-lg text-ink mt-1 leading-tight">{listing.name || listing.title}</p>
                <p className="text-xs text-muted-foreground mt-1">From {listing.ownerName || listing.lister} / {listing.area || 'Bengaluru'}</p>
              </div>
            </div>
            <div className="border-b border-border px-5 py-4 grid grid-cols-3 text-xs bg-secondary/10">
              <div>
                <p className="eyebrow">Pickup</p>
                <p className="text-ink mt-1 font-medium">{format(from, "d MMM")}</p>
              </div>
              <div>
                <p className="eyebrow">Return</p>
                <p className="text-ink mt-1 font-medium">{format(to, "d MMM")}</p>
              </div>
              <div>
                <p className="eyebrow">Days</p>
                <p className="text-ink mt-1 font-medium">{days}</p>
              </div>
            </div>
            <div className="px-5 py-6 space-y-3 text-sm">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">{inr(price)} x {days}</span><span className="text-ink font-medium">{inr(subtotal)}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Protection</span><span className="text-ink font-medium">{inr(protectionFee)}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Deposit (Refundable)</span><span className="text-ink font-medium">{inr(depositAmt)}</span></div>
              <div className="pt-4 border-t border-border flex justify-between items-end">
                <div>
                  <span className="text-ink font-bold text-base block">Total to pay</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Inclusive of all taxes</span>
                </div>
                <span className="font-display text-2xl text-ink">{inr(total)}</span>
              </div>
            </div>

            <div className="p-5">
              <button
                disabled={!allOk || processing}
                onClick={handlePayment}
                className="w-full bg-ink text-cream py-4 rounded-xl text-sm font-bold hover:bg-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg"
              >
                <span>{processing ? "Processing..." : `Confirm & Pay ${inr(total)}`}</span>
                <span className="text-[10px] opacity-60 font-normal uppercase tracking-wider">Secure via Razorpay</span>
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" /> SECURE SSL ENCRYPTED PAYMENT
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground text-center px-4">
            By confirming you agree to the WearShare rental terms and damage policy.
          </p>
        </aside>
      </section>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-6 hover:bg-secondary/5 transition-colors">
      <div>
        <p className="text-ink font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{note}</p>
      </div>
      <p className="text-ink font-bold whitespace-nowrap">{value}</p>
    </div>
  );
}
