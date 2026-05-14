"use client";
import Link from "next/link";

import { useState, useMemo, useRef } from "react";
import {
  ArrowUpRight, Camera, IndianRupee, ShieldCheck, Upload, X, Sparkles, Check,
} from "lucide-react";
import communityImg from "@/assets/community.jpg";
import { Calendar } from "@/components/ui/calendar";



const CATEGORIES = ["Lehenga", "Saree", "Sherwani", "Anarkali", "Gown", "Kurta", "Suit"];
const SIZES = ["XS", "S", "M", "L", "XL", "Free"];

export default function ListItem() {
  return (
    <div className="bg-background">
      <section className="container-edit pt-14 md:pt-20 pb-16 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7">
          <p className="eyebrow">For listers</p>
          <h1 className="font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.98] mt-4 text-ink">
            Idle wardrobes,<br />
            <span className="italic text-primary">honest income.</span>
          </h1>
          <p className="mt-7 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Most premium outfits are worn twice and forgotten. List yours in three minutes - keep
            full control over who rents, when, and at what price.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#new-listing" className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-primary transition-colors">
              Start listing - it's free <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 border border-ink text-ink px-6 py-3.5 text-sm font-medium hover:bg-ink hover:text-cream transition-colors">
              Read trust & safety
            </Link>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden bg-muted">
            <img src={communityImg.src} alt="Community lister" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* The actual listing form */}
      <ListingForm />

      {/* Earnings calculator */}
      <section className="bg-ink text-cream">
        <div className="container-edit py-20 md:py-28 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5">
            <p className="eyebrow text-cream/60">An idea of what you could earn</p>
            <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">
              A single saree.<br />Six rentals a year.
            </h2>
            <p className="mt-5 text-cream/70 max-w-md">
              Most pieces rent for 10-20% of their retail price per day. A ₹25,000 saree at ₹1,200/day,
              rented six times for two days, earns ₹14,400 - minus our 15% commission.
            </p>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              { t: "Lehenga", price: "₹1,800/day", rentals: "8 rentals/yr", earn: "₹24,480" },
              { t: "Sherwani", price: "₹1,500/day", rentals: "6 rentals/yr", earn: "₹15,300" },
              { t: "Designer Saree", price: "₹1,200/day", rentals: "6 rentals/yr", earn: "₹12,240" },
              { t: "Cocktail Gown", price: "₹850/day", rentals: "10 rentals/yr", earn: "₹14,450" },
            ].map((c) => (
              <div key={c.t} className="border border-cream/15 p-6">
                <p className="eyebrow text-cream/50">{c.t}</p>
                <p className="font-display text-2xl mt-2">{c.earn}/yr</p>
                <p className="mt-3 text-xs text-cream/60">{c.price} / {c.rentals}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="container-edit py-24 md:py-32">
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {[
            { n: "01", icon: Camera, t: "Photograph in daylight", d: "Upload 3-5 photos. AI fills in category, suggests fair pricing, drafts the description." },
            { n: "02", icon: IndianRupee, t: "Set your terms", d: "Pick days you're free for pickup. Choose deposit. Approve renters individually." },
            { n: "03", icon: ShieldCheck, t: "Hand over with cover", d: "Every booking covered for damage. We mediate disputes. Payouts within 48 hours." },
          ].map(({ n, icon: Icon, t, d }) => (
            <div key={n} className="bg-background p-8 md:p-10 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl italic text-primary">{n}</span>
                <Icon className="h-5 w-5 text-ink" />
              </div>
              <h3 className="font-display text-2xl text-ink leading-snug">{t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ListingForm() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Lehenga");
  const [size, setSize] = useState("M");
  const [retail, setRetail] = useState<number | "">("");
  const [pricePerDay, setPricePerDay] = useState<number | "">("");
  const [deposit, setDeposit] = useState<number | "">("");
  const [unavailable, setUnavailable] = useState<Date[] | undefined>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const suggestedPrice = useMemo(() => {
    const r = typeof retail === "number" ? retail : 0;
    return r > 0 ? Math.round((r * 0.05) / 50) * 50 : 0;
  }, [retail]);
  const suggestedDeposit = useMemo(() => {
    const r = typeof retail === "number" ? retail : 0;
    return r > 0 ? Math.round((r * 0.18) / 100) * 100 : 0;
  }, [retail]);

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const next: string[] = [];
    Array.from(files).slice(0, 6 - photos.length).forEach((f) => {
      if (f.type.startsWith("image/")) next.push(URL.createObjectURL(f));
    });
    setPhotos((p) => [...p, ...next].slice(0, 6));
  };

  const removePhoto = (i: number) =>
    setPhotos((p) => p.filter((_, idx) => idx !== i));

  const canSubmit = photos.length >= 3 && title && pricePerDay && deposit;

  if (submitted) {
    return (
      <section id="new-listing" className="bg-secondary/40 py-24">
        <div className="container-edit max-w-xl text-center">
          <div className="h-14 w-14 rounded-full bg-primary text-cream mx-auto flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="font-display text-4xl mt-6 text-ink">Listing submitted.</h2>
          <p className="mt-3 text-muted-foreground">
            Our team reviews new listings within 4 hours. You'll get a WhatsApp ping the moment it goes live.
          </p>
          <button
            onClick={() => { setSubmitted(false); setPhotos([]); setTitle(""); setRetail(""); setPricePerDay(""); setDeposit(""); setUnavailable([]); }}
            className="mt-8 inline-flex items-center gap-2 border border-ink text-ink px-5 py-2.5 text-sm hover:bg-ink hover:text-cream transition"
          >
            List another piece
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="new-listing" className="bg-secondary/40 py-20 md:py-24 border-y border-border">
      <div className="container-edit">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="eyebrow">Step by step</p>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-ink leading-tight">
              List your<br /><span className="italic text-primary">first piece.</span>
            </h2>
            <p className="mt-5 text-muted-foreground text-sm leading-relaxed">
              Three photos, a fair price, and the dates you're free for pickup. That's it.
              You can edit anything later.
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            className="md:col-span-8 bg-background border border-border p-6 md:p-10 space-y-10"
          >
            {/* Photos */}
            <div>
              <Label num="01" title="Photos" hint={`${photos.length}/6 / minimum 3 in daylight`} />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {photos.map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden bg-muted group">
                    <img src={src} alt={`upload ${i + 1}`} className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-ink text-cream text-[9px] uppercase tracking-widest px-1.5 py-0.5">Cover</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 h-6 w-6 bg-cream/90 text-ink rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary flex flex-col items-center justify-center gap-1 transition"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-[11px] uppercase tracking-widest">Add</span>
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </div>

            {/* Basics */}
            <div>
              <Label num="02" title="The piece" hint="Title, category, size" />
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <Field label="Title">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                    placeholder="e.g. Emerald silk lehenga"
                    className="form-input"
                    required
                  />
                </Field>
                <Field label="Category">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Size">
                  <div className="flex gap-1.5 flex-wrap">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`text-xs px-3 py-2 border ${size === s ? "bg-ink text-cream border-ink" : "border-border text-ink hover:border-ink"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Retail price (₹)">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={retail}
                    onChange={(e) => setRetail(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="32000"
                    className="form-input"
                  />
                </Field>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <Label num="03" title="Pricing" hint="Set your daily rate and deposit" />
              {suggestedPrice > 0 && (
                <div className="mt-3 flex items-start gap-2 text-xs text-primary bg-primary/5 border border-primary/20 px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Based on similar pieces, we suggest <strong>?{suggestedPrice}/day</strong> with a{" "}
                    <strong>?{suggestedDeposit}</strong> refundable deposit.{" "}
                    <button
                      type="button"
                      onClick={() => { setPricePerDay(suggestedPrice); setDeposit(suggestedDeposit); }}
                      className="underline ml-1"
                    >
                      Apply
                    </button>
                  </span>
                </div>
              )}
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <Field label="Price per day (₹)">
                  <input
                    type="number"
                    min={0}
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="1500"
                    className="form-input"
                    required
                  />
                </Field>
                <Field label="Refundable deposit (₹)">
                  <input
                    type="number"
                    min={0}
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="5000"
                    className="form-input"
                    required
                  />
                </Field>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                WearShare keeps a 15% commission. You see the net payout before publishing.
              </p>
            </div>

            {/* Availability calendar */}
            <div>
              <Label num="04" title="Availability" hint="Tap dates you're NOT available" />
              <div className="mt-4 flex flex-col md:flex-row gap-6">
                <div className="border border-border bg-background">
                  <Calendar
                    mode="multiple"
                    selected={unavailable}
                    onSelect={setUnavailable}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="p-3 pointer-events-auto"
                  />
                </div>
                <div className="text-sm flex-1">
                  <p className="eyebrow">Blocked dates</p>
                  {unavailable && unavailable.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {unavailable
                        .slice()
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((d) => (
                          <li key={d.toISOString()} className="text-xs bg-ink text-cream px-2 py-1">
                            {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-muted-foreground text-xs">Open every day. Renters can request any date.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="hairline pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                By listing, you agree to WearShare's{" "}
                <Link href="/how-it-works" className="underline">trust & safety policy</Link>.
              </p>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 bg-ink text-cream px-7 py-3.5 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Publish listing <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Label({ num, title, hint }: { num: string; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-display italic text-primary">{num}</span>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {hint && <span className="text-[11px] text-muted-foreground ml-auto">{hint}</span>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
