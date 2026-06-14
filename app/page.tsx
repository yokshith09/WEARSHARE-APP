import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles, ShieldCheck, MapPin, Calendar, Star } from "lucide-react";
import heroImg from "@/assets/hero-lehenga.jpg";
import communityImg from "@/assets/community.jpg";
import { listings as dummyListings, inr } from "@/lib/listings";
import { ListingCard } from "@/components/listing-card";
import { supabaseAdmin } from "@/lib/supabase";
import { WaitlistForm } from "@/components/waitlist-form";

export const revalidate = 60;

type HomeListing = {
  _id?: string;
  id: string;
  name?: string;
  title: string;
  description?: string;
  category?: string;
  city?: string;
  pincode?: string;
  area?: string;
  size?: string;
  condition?: string;
  rentalPricePerDay?: number;
  pricePerDay?: number;
  securityDeposit?: number;
  deposit?: number;
  imageUrl?: string;
  image?: string;
  available?: boolean;
  ownerId?: {
    _id: string;
    name: string;
    isVerified: boolean;
    rating: number;
  } | null;
  lister?: string;
};

export default async function Index() {
  let featured: HomeListing[] = [];
  let editorial: HomeListing[] = [];
  let locationLabel = "Bengaluru";
  let pincodeLabel = "560038";

  try {
    const { data: listings, error } = await supabaseAdmin
      .from("listings")
      .select(`
        *,
        owner:users!owner_id (
          id,
          name,
          is_verified,
          rating
        )
      `)
      .eq("available", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const plainData: HomeListing[] = (listings || []).map((listing) => ({
      _id: listing.id,
      id: listing.id,
      name: listing.title,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      city: listing.city,
      pincode: listing.pincode,
      area: listing.area,
      size: listing.size,
      condition: listing.condition,
      rentalPricePerDay: listing.rental_price_per_day,
      pricePerDay: listing.rental_price_per_day,
      securityDeposit: listing.security_deposit,
      deposit: listing.security_deposit,
      imageUrl: listing.image_url,
      image: listing.image_url,
      available: listing.available,
      ownerId: listing.owner
        ? {
            _id: listing.owner.id,
            name: listing.owner.name,
            isVerified: listing.owner.is_verified,
            rating: listing.owner.rating,
          }
        : null,
      lister: listing.owner?.name,
    }));

    if (plainData.length > 0) {
      featured = plainData.slice(0, 4);
      editorial = plainData.length >= 3 ? plainData.slice(2, 5) : plainData.slice(0, 3);
      locationLabel = plainData[0]?.city || plainData[0]?.area || locationLabel;
      pincodeLabel = plainData[0]?.pincode || pincodeLabel;
      if (editorial.length < 3) {
        editorial = [...editorial, ...dummyListings].slice(0, 3) as HomeListing[];
      }
    } else {
      featured = dummyListings.slice(0, 4) as HomeListing[];
      editorial = dummyListings.slice(2, 5) as HomeListing[];
    }
  } catch (error) {
    console.error("Failed to fetch listings for landing page:", error);
    featured = dummyListings.slice(0, 4) as HomeListing[];
    editorial = dummyListings.slice(2, 5) as HomeListing[];
  }

  return (
    <div className="bg-background">
      <section className="container-edit pt-10 pb-20 md:pt-16 md:pb-28">
        <div className="grid items-end gap-10 md:grid-cols-12 md:gap-16">
          <div className="order-2 md:order-1 md:col-span-7">
            <p className="eyebrow animate-fade-up">A neighbourhood wardrobe / Est. Bengaluru</p>
            <h1 className="mt-5 font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] text-ink animate-fade-up">
              Wear it once.
              <br />
              <span className="italic text-primary">Share</span> it forward.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground animate-fade-up md:text-lg">
              Premium outfits for weddings, parties and college nights, rented from verified listers within
              your pincode. No fast fashion. No storage. No regrets.
            </p>
            <form action="/browse" className="mt-9 flex flex-col flex-wrap items-start gap-3 animate-fade-up sm:flex-row sm:items-center">
              <div className="flex w-full items-center rounded-lg border border-border bg-background px-4 py-1 sm:w-auto">
                <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  name="pincode"
                  placeholder="Enter Pincode (e.g. 560038)"
                  className="w-full border-none bg-transparent py-2.5 text-sm text-ink outline-none sm:w-48"
                  maxLength={6}
                />
              </div>
              <button type="submit" className="btn-primary w-full sm:w-auto">
                Browse outfits near you
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </button>
              <Link href="/list-item" className="btn-outline w-full text-center sm:w-auto">
                List your wardrobe
              </Link>
            </form>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                ["10-20%", "of retail price"],
                ["Rs 500-5K", "earned monthly"],
                ["48h", "lister response"],
              ].map(([number, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl text-rust">{number}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative order-1 md:order-2 md:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
              <Image
                src={heroImg}
                alt="Editorial portrait of an Indian woman in an emerald and gold lehenga"
                priority
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="panel absolute -bottom-6 -left-4 max-w-[240px] p-5 md:-left-10">
              <p className="eyebrow">This look</p>
              <p className="mt-1 font-display text-base leading-snug text-ink">Emerald Silk Lehenga by Deepa M.</p>
              <p className="mt-2 text-xs text-muted-foreground">Indiranagar / 2.4 km</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-ink">{inr(1800)}/day</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-3 w-3 fill-primary text-primary" /> 4.9
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-border bg-secondary/40 py-5">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex items-center gap-12 text-sm font-display italic text-ink/70">
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

      <section className="container-edit py-20 md:py-28">
        <div className="mb-10 flex items-end justify-between md:mb-14">
          <div>
            <p className="eyebrow">In your neighbourhood / {locationLabel} {pincodeLabel}</p>
            <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">This week&apos;s picks</h2>
          </div>
          <Link href="/browse" className="hidden items-center gap-1 border-b border-ink pb-1 text-sm text-ink transition-colors hover:border-primary hover:text-primary md:inline-flex">
            View all outfits <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {featured.map((listing, index) => (
            <ListingCard key={listing._id || listing.id} listing={listing} priority={index < 2} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="container-edit grid gap-12 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-4">
            <p className="eyebrow">How WearShare works</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
              Three steps. <span className="italic text-primary">Zero stress.</span>
            </h2>
            <p className="mt-5 text-muted-foreground">
              Designed for first-time renters and listers. Every step protected by deposit cover and our
              48-hour damage resolution promise.
            </p>
            <Link href="/how-it-works" className="mt-8 inline-flex items-center gap-1 border-b border-ink pb-1 text-sm text-ink hover:border-primary hover:text-primary">
              The full process <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-px bg-border sm:grid-cols-3 md:col-span-8">
            {[
              { n: "01", icon: MapPin, t: "Discover near you", d: "Filter by occasion, size, distance and the date you need it. Real photos. Real fits." },
              { n: "02", icon: Calendar, t: "Book the dates", d: "Pay rental + deposit through UPI. Lister confirms within 48 hours. Pickup or delivery." },
              { n: "03", icon: ShieldCheck, t: "Wear, return, review", d: "Return cleaned. Deposit released within 24 hrs. Both sides leave a review." },
            ].map(({ n, icon: Icon, t, d }) => (
              <div key={n} className="flex flex-col gap-4 bg-background p-7 md:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl italic text-primary">{n}</span>
                  <Icon className="h-5 w-5 text-ink" />
                </div>
                <h3 className="font-display text-xl leading-snug text-ink">{t}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-edit py-24 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-12 md:gap-20">
          <div className="relative md:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
              <Image
                src={communityImg}
                alt="Friends sharing outfits in a sunlit room"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -right-5 -top-5 hidden max-w-[200px] rounded-xl bg-primary p-5 text-primary-foreground shadow-lg md:block">
              <Sparkles className="mb-2 h-4 w-4" />
              <p className="font-display text-sm leading-snug">73% of clothes in Indian wardrobes are worn fewer than 3 times.</p>
            </div>
          </div>
          <div className="md:col-span-6">
            <p className="eyebrow">For listers</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
              Your wardrobe
              <br />
              is already <span className="italic text-primary">earning.</span>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
              Lehengas worn at one wedding. Suits gathering dust. Sarees passed down but unworn.
              List them in three minutes. Approve who rents. Earn Rs 500-Rs 5,000 every month.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Damage cover on every booking, automatically",
                "AI-assisted listing, live in under 5 minutes",
                "You approve every renter before they pay",
                "Payouts to UPI within 48 hours of return",
              ].map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span className="mt-2 inline-block h-1 w-3 shrink-0 bg-primary" />
                  <span className="text-ink">{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex gap-3">
              <Link href="/list-item" className="btn-secondary">
                Start listing - it&apos;s free
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="container-edit py-24 md:py-32">
          <p className="eyebrow text-cream/60">Voices from the community</p>
          <h2 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] md:text-6xl">
            "I wore a Rs 40,000 lehenga to my best friend&apos;s wedding for <span className="italic text-primary">Rs 1,500</span> and she didn&apos;t recognise it was rented."
          </h2>
          <p className="mt-8 text-sm text-cream/60">- Priya, 24 / Bengaluru</p>

          <div className="mt-20 grid gap-px bg-cream/10 md:grid-cols-3">
            {[
              { q: "Earned Rs 18,400 from sarees that had not moved in two years.", a: "Deepa M., Indiranagar" },
              { q: "Pickup was 800 metres away. I walked there with my laptop bag.", a: "Rahul S., HSR" },
              { q: "Reviewed every renter. Felt safer than selling secondhand online.", a: "Meera J., Indiranagar" },
            ].map((voice) => (
              <div key={voice.a} className="bg-ink p-8">
                <p className="font-display text-xl leading-snug">"{voice.q}"</p>
                <p className="mt-5 text-xs uppercase tracking-widest text-cream/60">{voice.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {editorial.length > 0 && (
        <section className="container-edit py-24 md:py-32">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="eyebrow">Edit no. 02</p>
              <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">For the season ahead</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-12">
            <div className="md:col-span-7">
              {editorial[0] && <ListingCard listing={editorial[0]} />}
            </div>
            <div className="grid gap-5 md:col-span-5">
              {editorial[1] && <ListingCard listing={editorial[1]} />}
              {editorial[2] && <ListingCard listing={editorial[2]} />}
            </div>
          </div>
        </section>
      )}

      <section className="container-edit py-24 md:py-32">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="eyebrow">Curated for you</p>
            <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">Shop by Collection</h2>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <CollectionCard href="/browse?category=men" src="/men_collection.png" title="MEN" />
          <CollectionCard href="/browse?category=women" src="/women_collection.png" title="WOMEN" />
          <CollectionCard href="/browse?category=accessories" src="/accessories_collection.png" title="ACCESSORIES" />
        </div>
      </section>

      <section className="container-edit pb-24">
        <div className="rounded-xl border border-ink p-10 text-center md:p-16">
          <p className="eyebrow">Join the waitlist for new pincodes</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            A wardrobe shared is
            <br />
            a wardrobe <span className="italic text-primary">multiplied.</span>
          </h2>
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}

function CollectionCard({ href, src, title }: { href: string; src: string; title: string }) {
  return (
    <Link href={href} className="group relative block aspect-[4/5] overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md">
      <Image
        src={src}
        alt={`${title} collection`}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
      <div className="absolute inset-x-0 bottom-0 flex h-full flex-col items-center justify-end p-10 text-center">
        <h3 className="mb-6 font-sans text-4xl font-semibold tracking-normal text-white md:text-5xl">{title}</h3>
        <span className="translate-y-4 rounded-md bg-white px-8 py-3.5 text-sm font-medium text-ink opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          See details
        </span>
      </div>
    </Link>
  );
}
