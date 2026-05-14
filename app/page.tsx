"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

import { ArrowUpRight, Sparkles, ShieldCheck, MapPin, Calendar, Star } from "lucide-react";
import heroImg from "@/assets/hero-lehenga.jpg";
import communityImg from "@/assets/community.jpg";
import { listings as dummyListings, inr } from "@/lib/listings";
import { ListingCard } from "@/components/listing-card";

export default function Index() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [editorial, setEditorial] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFeatured(data.slice(0, 4));
          setEditorial(data.slice(2, 5));
        } else {
          // Fallback if DB is empty for some reason
          setFeatured(dummyListings.slice(0, 4));
          setEditorial(dummyListings.slice(2, 5));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="bg-background">
      {/* HERO - editorial split */}
      <section className="container-edit pt-10 md:pt-16 pb-20 md:pb-28">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-end">
          <div className="md:col-span-7 order-2 md:order-1">
            <p className="eyebrow animate-fade-up">A neighbourhood wardrobe / Est. Bengaluru</p>
            <h1 className="mt-5 font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] text-ink animate-fade-up">
              Wear it once.<br />
              <span className="italic text-primary">Share</span> it forward.
            </h1>
            <p className="mt-7 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed animate-fade-up">
              Premium outfits for weddings, parties and college nights - rented from verified listers within
              your pincode. No fast fashion. No storage. No regrets.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up">
              <Link
                href="/browse"
                className="btn-primary"
              >
                Browse outfits near you
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/list-item"
                className="btn-outline"
              >
                List your wardrobe
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                ["10-20%", "of retail price"],
                ["₹500-5K", "earned monthly"],
                ["48h", "lister response"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl text-rust">{n}</dt>
                  <dd className="text-xs text-muted-foreground mt-1">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="md:col-span-5 order-1 md:order-2 relative">
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={heroImg.src}
                alt="Editorial portrait of an Indian woman in an emerald and gold lehenga"
                width={1080}
                height={1440}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="panel absolute -bottom-6 -left-4 max-w-[240px] p-5 md:-left-10">
              <p className="eyebrow">This look</p>
              <p className="font-display text-base mt-1 text-ink leading-snug">Emerald Silk Lehenga by Deepa M.</p>
              <p className="text-xs text-muted-foreground mt-2">Indiranagar / 2.4 km</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-ink font-medium">{inr(1800)}/day</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-3 w-3 fill-primary text-primary" /> 4.9
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-border py-5 overflow-hidden bg-secondary/40">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center text-sm font-display italic text-ink/70">
              <span>Weddings</span><span> / </span>
              <span>Sangeet</span><span> / </span>
              <span>Receptions</span><span> / </span>
              <span>Cocktail</span><span> / </span>
              <span>Diwali</span><span> / </span>
              <span>Convocation</span><span> / </span>
              <span>Engagement</span><span> / </span>
              <span>Festivals</span><span> / </span>
              <span>Mehendi</span><span> / </span>
              <span>Birthday</span><span> / </span>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED LISTINGS */}
      <section className="container-edit py-20 md:py-28">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <p className="eyebrow">In your neighbourhood / Bengaluru 560038</p>
            <h2 className="font-display text-4xl md:text-5xl text-ink mt-3">This week's picks</h2>
          </div>
          <Link href="/browse" className="hidden md:inline-flex items-center gap-1 text-sm text-ink border-b border-ink pb-1 hover:text-primary hover:border-primary transition-colors">
            View all 124 outfits <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
          {featured.map((l, i) => (
            <ListingCard key={l._id || l.id} listing={l} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="container-edit py-20 md:py-28 grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <p className="eyebrow">How WearShare works</p>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-ink leading-tight">
              Three steps. <span className="italic text-primary">Zero stress.</span>
            </h2>
            <p className="mt-5 text-muted-foreground">
              Designed for first-time renters and listers. Every step protected by deposit cover and our
              48-hour damage resolution promise.
            </p>
            <Link href="/how-it-works" className="mt-8 inline-flex items-center gap-1 text-sm text-ink border-b border-ink pb-1 hover:text-primary hover:border-primary">
              The full process <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="md:col-span-8 grid sm:grid-cols-3 gap-px bg-border">
            {[
              { n: "01", icon: MapPin, t: "Discover near you", d: "Filter by occasion, size, distance and the date you need it. Real photos. Real fits." },
              { n: "02", icon: Calendar, t: "Book the dates", d: "Pay rental + deposit through UPI. Lister confirms within 48 hours. Pickup or delivery." },
              { n: "03", icon: ShieldCheck, t: "Wear, return, review", d: "Return cleaned. Deposit released within 24 hrs. Both sides leave a review." },
            ].map(({ n, icon: Icon, t, d }) => (
              <div key={n} className="bg-background p-7 md:p-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl italic text-primary">{n}</span>
                  <Icon className="h-5 w-5 text-ink" />
                </div>
                <h3 className="font-display text-xl text-ink leading-snug">{t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL EARN BLOCK */}
      <section className="container-edit py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-12 md:gap-20 items-center">
          <div className="md:col-span-6 relative">
            <img
              src={communityImg.src}
              alt="Friends sharing outfits in a sunlit room"
              width={1400}
              height={900}
              loading="lazy"
              className="w-full h-auto"
            />
            <div className="absolute -top-5 -right-5 bg-primary text-primary-foreground p-5 max-w-[200px] hidden md:block">
              <Sparkles className="h-4 w-4 mb-2" />
              <p className="font-display text-sm leading-snug">73% of clothes in Indian wardrobes are worn fewer than 3 times.</p>
            </div>
          </div>
          <div className="md:col-span-6">
            <p className="eyebrow">For listers</p>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-ink leading-tight">
              Your wardrobe<br />is already <span className="italic text-primary">earning.</span>
            </h2>
            <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
              Lehengas worn at one wedding. Suits gathering dust. Sarees passed down but unworn.
              List them in three minutes. Approve who rents. Earn ₹500-₹5,000 every month.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Damage cover on every booking - automatically",
                "AI-assisted listing, live in under 5 minutes",
                "You approve every renter before they pay",
                "Payouts to UPI within 48 hours of return",
              ].map((b) => (
                <li key={b} className="flex gap-3 items-start">
                  <span className="mt-2 h-1 w-3 bg-primary inline-block shrink-0" />
                  <span className="text-ink">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex gap-3">
              <Link href="/list-item" className="btn-secondary">
                Start listing - it's free
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / VOICES */}
      <section className="bg-ink text-cream">
        <div className="container-edit py-24 md:py-32">
          <p className="eyebrow text-cream/60">Voices from the community</p>
          <h2 className="font-display text-4xl md:text-6xl mt-4 max-w-4xl leading-[1.05]">
            "I wore a ₹40,000 lehenga to my best friend's wedding for <span className="italic text-primary">₹1,500</span> - and she didn't recognise it was rented."
          </h2>
          <p className="mt-8 text-cream/60 text-sm">- Priya, 24 / Bengaluru</p>

          <div className="mt-20 grid md:grid-cols-3 gap-px bg-cream/10">
            {[
              { q: "Earned ₹18,400 from sarees that hadn't moved in two years.", a: "Deepa M., Indiranagar" },
              { q: "Pickup was 800 metres away. I walked there with my laptop bag.", a: "Rahul S., HSR" },
              { q: "Reviewed every renter. Felt safer than selling secondhand online.", a: "Meera J., Indiranagar" },
            ].map((v) => (
              <div key={v.a} className="bg-ink p-8">
                <p className="font-display text-xl leading-snug">"{v.q}"</p>
                <p className="mt-5 text-xs text-cream/60 uppercase tracking-widest">{v.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL GRID - secondary */}
      <section className="container-edit py-24 md:py-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow">Edit no. 02</p>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-ink">For the season ahead</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-12 gap-5">
          <div className="md:col-span-7">
            {editorial[0] && <ListingCard listing={editorial[0]} />}
          </div>
          <div className="md:col-span-5 grid gap-5">
            {editorial[1] && <ListingCard listing={editorial[1]} />}
            {editorial[2] && <ListingCard listing={editorial[2]} />}
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="container-edit py-24 md:py-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow">Curated for you</p>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-ink">Shop by Collection</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Link href="/browse?category=men" className="group relative aspect-[4/5] overflow-hidden rounded-md block shadow-sm hover:shadow-md transition-shadow">
            <img src="/men_collection.png" alt="Men's Collection" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
            <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col items-center justify-end h-full text-center">
              <h3 className="font-sans text-4xl md:text-5xl font-semibold text-white mb-6 tracking-normal">MEN</h3>
              <span className="rounded-md bg-white px-8 py-3.5 text-sm font-medium text-ink shadow-lg transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                See details
              </span>
            </div>
          </Link>
          
          <Link href="/browse?category=women" className="group relative aspect-[4/5] overflow-hidden rounded-md block shadow-sm hover:shadow-md transition-shadow">
            <img src="/women_collection.png" alt="Women's Collection" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
            <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col items-center justify-end h-full text-center">
              <h3 className="font-sans text-4xl md:text-5xl font-semibold text-white mb-6 tracking-normal">WOMEN</h3>
              <span className="rounded-md bg-white px-8 py-3.5 text-sm font-medium text-ink shadow-lg transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                See details
              </span>
            </div>
          </Link>

          <Link href="/browse?category=accessories" className="group relative aspect-[4/5] overflow-hidden rounded-md block shadow-sm hover:shadow-md transition-shadow">
            <img src="/accessories_collection.png" alt="Accessories Collection" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
            <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col items-center justify-end h-full text-center">
              <h3 className="font-sans text-4xl md:text-5xl font-semibold text-white mb-6 tracking-normal">ACCESSORIES</h3>
              <span className="rounded-md bg-white px-8 py-3.5 text-sm font-medium text-ink shadow-lg transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                See details
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-edit pb-24">
        <div className="border border-ink p-10 md:p-16 text-center">
          <p className="eyebrow">Join the waitlist for new pincodes</p>
          <h2 className="font-display text-4xl md:text-6xl mt-4 text-ink leading-[1.05]">
            A wardrobe shared is<br />a wardrobe <span className="italic text-primary">multiplied.</span>
          </h2>
          <form className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="your@email.in"
              className="flex-1 bg-transparent border border-ink px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button type="button" className="bg-ink text-cream px-6 py-3 text-sm font-medium hover:bg-primary transition-colors">
              Notify me
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
