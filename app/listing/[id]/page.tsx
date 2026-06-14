"use client";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  Star, MapPin, BadgeCheck, ShieldCheck, MessageCircle, Ruler, ArrowLeft, Calendar as CalendarIconLucide, Zap, ShoppingCart, Sparkles
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { inr, isDateBlocked } from "@/lib/listings";
import { ListingCard } from "@/components/listing-card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useParams, useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export default function ListingDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [others, setOthers] = useState<any[]>([]);
  const [range, setRange] = useState<DateRange | undefined>();
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState("");

  const days = useMemo(() => {
    if (range?.from && range?.to) return Math.max(1, differenceInCalendarDays(range.to, range.from) + 1);
    return 0;
  }, [range]);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setListing(data);
          trackEvent("listing_viewed", {
            listingId: data.id || data._id,
            category: data.category,
            pricePerDay: data.rentalPricePerDay || data.pricePerDay,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           setOthers(data.filter(l => l._id !== id).slice(0, 3));
        }
      });
  }, [id]);
  
  if (loading) {
    return (
      <div className="container-edit py-32 text-center">
        <p className="font-display text-2xl text-muted-foreground">Loading outfit...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container-edit py-32 text-center">
        <p className="font-display text-3xl">Outfit not found</p>
        <Link href="/browse" className="mt-6 inline-block text-primary underline">Back to browse</Link>
      </div>
    );
  }

  const isVerified = listing.ownerId?.isVerified || listing.verified;
  const image = listing.imageUrl || listing.imageData || listing.image;
  const title = listing.name || listing.title;
  const price = listing.rentalPricePerDay || listing.pricePerDay;
  const rating = listing.ownerId?.rating || listing.rating || 4.5;
  const area = listing.area || 'Bengaluru';
  const size = listing.size;
  const category = listing.category;
  const listerName = listing.ownerId?.name || listing.ownerName || listing.lister || 'Lister';
  const listerInitial = listerName.charAt(0);
  const deposit = listing.securityDeposit || listing.deposit || 0;
  const retailPrice = listing.buyPrice || listing.retailPrice || (price * 20);
  
  const subtotal = days * price;
  const protectionFee = Math.round(subtotal * 0.05);
  const total = subtotal + protectionFee + deposit;

  const addToCart = async () => {
    if (!range?.from || !range?.to || days <= 0) return;
    setAddingToCart(true);
    setCartError("");
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing._id || listing.id,
          days,
          rentalStart: range.from.toISOString().split("T")[0],
          rentalEnd: range.to?.toISOString().split("T")[0],
        })
      });
      if (res.ok) {
         trackEvent("add_to_cart", { listingId: listing._id || listing.id, days, source: "rent_now" });
         router.push('/cart');
      } else if (res.status === 401) {
         router.push(`/login?callbackUrl=/listing/${listing._id || listing.id}`);
      } else {
         const data = await res.json().catch(() => ({}));
         setCartError(data.error || 'Unable to add this outfit to cart.');
      }
    } catch (e) {
      console.error(e);
      setCartError('Unable to add this outfit to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="container-edit pt-8">
        <Link href="/browse" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to browse
        </Link>
      </div>

      <section className="container-edit pt-6 pb-16 grid md:grid-cols-12 gap-10 md:gap-16">
        {/* Gallery */}
        <div className="md:col-span-7">
          <div className="aspect-[4/5] overflow-hidden bg-muted rounded-2xl shadow-xl border border-border">
            <img src={image} alt={title} className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[image, image, image, image].map((src, i) => (
              <button key={i} className={`aspect-square overflow-hidden rounded-xl shadow-sm ${i === 0 ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100 transition-opacity"}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info / Booking */}
        <div className="md:col-span-5 md:sticky md:top-28 md:self-start">
          <p className="eyebrow">{listing.occasion} / {category}</p>
          <h1 className="font-display text-4xl md:text-5xl mt-3 text-ink leading-tight">{title}</h1>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 text-ink">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              {rating.toFixed(1)} / {listing.reviews || 0} reviews
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {area} / {listing.distanceKm || 5} km
            </span>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                <BadgeCheck className="h-3.5 w-3.5" /> Trusted Lender
              </span>
            )}
          </div>

          <div className="mt-8 flex items-end gap-4">
            <p className="font-display text-4xl text-ink">{price ? `₹${price.toLocaleString("en-IN")}` : '₹0'}<span className="text-base text-muted-foreground font-sans">/day</span></p>
            <p className="text-sm text-muted-foreground line-through">{retailPrice ? `₹${retailPrice.toLocaleString("en-IN")}` : '₹0'} retail</p>
          </div>
          <p className="mt-1 text-xs text-primary font-medium">
            That's {Math.round((price / retailPrice) * 100 * 10) / 10 || 0}% of retail per day
          </p>

          {/* Availability picker */}
          <div className="mt-7 border border-border">
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full p-5 grid grid-cols-3 gap-3 text-sm text-left hover:bg-secondary/30 transition">
                  <div>
                    <p className="eyebrow">Pickup</p>
                    <p className="text-ink mt-1 flex items-center gap-1.5">
                      <CalendarIconLucide className="h-3.5 w-3.5 text-primary" />
                      {range?.from ? format(range.from, "d MMM") : "Select"}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow">Return</p>
                    <p className="text-ink mt-1 flex items-center gap-1.5">
                      <CalendarIconLucide className="h-3.5 w-3.5 text-primary" />
                      {range?.to ? format(range.to, "d MMM") : "Select"}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow">Days</p>
                    <p className="text-ink mt-1">{days || "-"}</p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  disabled={(d) =>
                    d < new Date(new Date().setHours(0,0,0,0)) || isDateBlocked(listing, d)
                  }
                  className="p-3 pointer-events-auto"
                />
                <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
                  Greyed dates are already booked.
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {days > 0 && (
            <div className="mt-3 text-sm border border-border p-4 space-y-1.5 rounded-xl bg-secondary/20">
              <div className="flex justify-between"><span className="text-muted-foreground">{inr(price)} x {days} days</span><span className="text-ink">{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Protection fee</span><span className="text-ink">{inr(protectionFee)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Refundable deposit</span><span className="text-ink">{inr(deposit)}</span></div>
              <div className="flex justify-between hairline pt-2 mt-2"><span className="text-ink font-medium">Total</span><span className="text-ink font-medium">{inr(total)}</span></div>
            </div>
          )}

          {days > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  if (!range?.from || !range?.to || days <= 0) return;
                  setAddingToCart(true);
                  try {
                    const res = await fetch('/api/cart', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        listingId: listing._id || listing.id,
                        days,
                        rentalStart: range.from.toISOString().split("T")[0],
                        rentalEnd: range.to?.toISOString().split("T")[0],
                      })
                    });
                    if (res.status === 401) {
                      router.push(`/login?callbackUrl=/listing/${listing._id || listing.id}`);
                      return;
                    }
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      setCartError(data.error || 'Unable to add this outfit to cart.');
                      return;
                    }
                    trackEvent("add_to_cart", { listingId: listing._id || listing.id, days, source: "detail" });
                    // Just add to cart, no redirect
                    setAddingToCart(false);
                  } catch (e) {
                    setAddingToCart(false);
                  }
                }}
                disabled={addingToCart}
                className="w-full bg-secondary text-ink rounded-xl py-4 text-sm font-bold hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 border border-border"
              >
                <ShoppingCart className="h-4 w-4" /> {addingToCart ? "Adding..." : "Add to Cart"}
              </button>
              <button
                onClick={addToCart}
                className="w-full bg-primary text-white rounded-xl py-4 text-sm font-bold hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" /> Rent Now
              </button>
            </div>
          ) : (
            <button disabled className="mt-4 w-full bg-ink text-cream rounded-xl py-4 text-sm font-medium opacity-40 cursor-not-allowed">
              Pick dates to continue
            </button>
          )}
          {cartError && <p className="mt-3 text-sm text-red-600">{cartError}</p>}
          <Link
            href={`/trips/${listing._id || listing.id}`}
            className="mt-2 w-full border border-ink text-ink rounded-xl py-3.5 text-sm font-medium hover:bg-ink hover:text-cream transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" /> Message {listerName.split(" ")[0]} first
          </Link>

          <p className="mt-3 text-[11px] text-muted-foreground text-center">
            Refundable deposit {inr(deposit)} / Released within 24h of return
          </p>

          {/* Fit + Size */}
          <div className="mt-8 space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <div className="bg-primary text-white p-2 rounded-full">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-primary text-sm">92% Match</p>
                <p className="text-xs text-muted-foreground">This likely fits you based on your measurements.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="border border-border p-4 rounded-xl">
                <p className="eyebrow flex items-center gap-1"><Ruler className="h-3 w-3" /> Size</p>
                <p className="font-display text-2xl mt-1 text-ink">{size}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Bust 36" / Waist 30" / Length 42"</p>
              </div>
              <div className="border border-border p-4 rounded-xl">
                <p className="eyebrow">Fit confidence</p>
                <p className="font-display text-2xl mt-1 text-primary">{listing.fitScore || 90}<span className="text-sm text-muted-foreground">/100</span></p>
                <p className="mt-1 text-[11px] text-muted-foreground">Based on past renter feedback</p>
              </div>
            </div>
          </div>

          {/* Lister */}
          <div className="mt-8 hairline pt-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary/80 to-purple-400 flex items-center justify-center font-display text-xl text-white shadow-md">
              {listerInitial}
            </div>
            <div className="flex-1">
              <p className="font-display text-lg text-ink flex items-center gap-1.5">
                {listerName}
                {isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </p>
              <p className="text-xs text-muted-foreground">Lister since 2024 / Responds within 4 hrs / ID verified</p>
            </div>
          </div>

          {/* Trust */}
          <div className="mt-6 border border-primary/20 bg-primary/5 rounded-xl p-5 flex gap-4 items-start shadow-sm">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-ink font-semibold">Protected by WearShare cover</p>
              <p className="text-xs text-muted-foreground mt-1">Damage mediation, deposit handling, and verified pickup tracking included.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container-edit py-12 hairline">
        <div className="grid md:grid-cols-12 gap-10 mt-10">
          <div className="md:col-span-5">
            <p className="eyebrow">About this piece</p>
            <h2 className="font-display text-3xl mt-3 text-ink">Crafted for occasions that ask for more.</h2>
          </div>
          <div className="md:col-span-7 text-muted-foreground leading-relaxed space-y-4">
            <p>
              Hand-finished detailing on premium silk, with subtle weight that drapes beautifully through long
              evenings. Worn twice by the lister and dry-cleaned after each rental.
            </p>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-6 mt-8 text-sm">
              {[
                ["Fabric", "Pure silk"],
                ["Care", "Dry clean only"],
                ["Includes", "Top, skirt, dupatta"],
                ["Times worn", "2"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="container-edit py-16 hairline">
        <div className="grid md:grid-cols-12 gap-10 mt-10">
          <div className="md:col-span-4">
            <p className="eyebrow">Renter reviews</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-6xl text-ink">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 5</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-primary text-primary" : "text-border"}`} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{listing.reviews || 0} verified reviews</p>
          </div>
          <div className="md:col-span-8 space-y-6">
            {(listing.reviewItems ?? []).map((r: { author: string; rating: number; date: string; text: string }, i: number) => (
              <div key={i} className="border-b border-border pb-6 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-clay flex items-center justify-center text-sm font-display text-ink">
                      {r.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-ink font-medium">{r.author}</p>
                      <p className="text-[11px] text-muted-foreground">{r.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-primary text-primary" : "text-border"}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Similar */}
      <section className="container-edit py-20">
        <h2 className="font-display text-3xl md:text-4xl text-ink mb-10">Recommendations from Trusted Lenders</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12">
          {others.map((l) => <ListingCard key={l._id || l.id} listing={l} />)}
        </div>
      </section>
    </div>
  );
}
