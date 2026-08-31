"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, CalendarIcon, X, Mic, Search, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { isDateBlocked } from "@/lib/listings";
import { ListingCard } from "@/components/listing-card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

type CollectionType = "All" | "Women" | "Men" | "Accessories";

const collections: { id: CollectionType; label: string }[] = [
  { id: "All", label: "All Outfits" },
  { id: "Women", label: "Women" },
  { id: "Men", label: "Men" },
  { id: "Accessories", label: "Accessories" },
];

const allCategories = ["All", "Lehenga", "Saree", "Sherwani", "Anarkali", "Gown", "Kurta", "Suit", "Blazer", "Shirt", "Accessories"];
const womenCategories = ["All", "Lehenga", "Saree", "Anarkali", "Gown", "Co-ord Set", "Accessories"];
const menCategories = ["All", "Sherwani", "Kurta", "Suit", "Blazer", "Shirt", "Pant", "Accessories"];
const accessoriesCategories = ["All", "Accessories", "Watch", "Cap", "Belt", "Trolley", "Sneakers"];

const occasions = ["All", "Wedding", "Reception", "Sangeet", "Cocktail", "Festival", "Party", "Formal"];
const sizes = ["All", "XS", "S", "M", "L", "XL", "Free"];
const cities = ["All", "Bengaluru", "Coimbatore"];
const distances = [
  { label: "All", value: 999 },
  { label: "Under 2 km", value: 2 },
  { label: "Under 5 km", value: 5 },
  { label: "Under 10 km", value: 10 },
];

export default function Browse() {
  return (
    <Suspense fallback={<div className="container-edit py-20 text-sm text-muted-foreground">Loading outfits...</div>}>
      <BrowseContent />
    </Suspense>
  );
}

function parseInitialCollection(rawParam: string | null): { collection: CollectionType; category: string } {
  if (!rawParam) return { collection: "All", category: "All" };
  const lower = rawParam.trim().toLowerCase();
  if (lower === "men" || lower === "man" || lower === "male") return { collection: "Men", category: "All" };
  if (lower === "women" || lower === "woman" || lower === "female") return { collection: "Women", category: "All" };
  if (lower === "accessories" || lower === "accessory") return { collection: "Accessories", category: "All" };
  
  // Specific category provided (e.g. Lehenga, Sherwani)
  const matched = allCategories.find((c) => c.toLowerCase() === lower);
  if (matched) {
    if (["lehenga", "saree", "anarkali", "gown"].includes(lower)) return { collection: "Women", category: matched };
    if (["sherwani", "kurta", "suit", "blazer", "shirt", "pant", "tuxedo"].includes(lower)) return { collection: "Men", category: matched };
    if (lower === "accessories") return { collection: "Accessories", category: "All" };
    return { collection: "All", category: matched };
  }
  return { collection: "All", category: "All" };
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const rawCategoryParam = searchParams.get("category") || searchParams.get("collection") || searchParams.get("gender");
  const initialParsed = parseInitialCollection(rawCategoryParam);
  const initialPincode = searchParams.get("pincode") || "";
  const initialCity = searchParams.get("city") || "All";

  const [collection, setCollection] = useState<CollectionType>(initialParsed.collection);
  const [cat, setCat] = useState<string>(initialParsed.category);
  const [city, setCity] = useState(initialCity);
  const [occ, setOcc] = useState("All");
  const [size, setSize] = useState("All");
  const [maxKm, setMaxKm] = useState(999);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [sort, setSort] = useState("Recommended");
  const [searchTerm, setSearchTerm] = useState("");
  const [pincode, setPincode] = useState(initialPincode);
  const [listening, setListening] = useState(false);
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [apiListings, setApiListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const railRef = useRef<HTMLDivElement>(null);

  const scrollRail = (direction: number) => {
    railRef.current?.scrollBy({ left: direction, behavior: "smooth" });
  };

  // Sync state if URL query params change
  useEffect(() => {
    const parsed = parseInitialCollection(rawCategoryParam);
    setCollection(parsed.collection);
    setCat(parsed.category);
  }, [rawCategoryParam]);

  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        setApiListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeCategoryList = useMemo(() => {
    if (collection === "Women") return womenCategories;
    if (collection === "Men") return menCategories;
    if (collection === "Accessories") return accessoriesCategories;
    return allCategories;
  }, [collection]);

  const filtered = useMemo(
    () =>
      apiListings.filter(
        (l) => {
          const isVerified = l.ownerId?.isVerified || l.verified;
          const listingCat = l.category || 'All';
          const listingOcc = l.occasion || 'All';
          const listingGender = (l.gender || 'Unisex').toLowerCase();
          const listingCity = l.city || l.area || "Bengaluru";
          const listingPincode = String(l.pincode || "");
          const distanceKm = l.distanceKm || 0;
          const catLower = listingCat.toLowerCase();
          const text = `${l.title || l.name || ""} ${l.description || ""} ${listingCat} ${listingOcc} ${l.gender || ""}`.toLowerCase();

          // 1. Collection/Gender Filter
          let matchesCollection = true;
          if (collection === "Women") {
            matchesCollection =
              listingGender === "women" ||
              ["lehenga", "saree", "anarkali", "gown", "co-ord set"].includes(catLower);
          } else if (collection === "Men") {
            matchesCollection =
              listingGender === "men" ||
              ["sherwani", "kurta", "suit", "blazer", "shirt", "pant", "dhoti", "tuxedo"].includes(catLower);
          } else if (collection === "Accessories") {
            matchesCollection =
              catLower === "accessories" ||
              ["sneakers", "cap", "watch", "belt", "trolley", "bag"].some((k) => text.includes(k));
          }

          // 2. Specific Category Filter
          let matchesCategory = true;
          if (cat !== "All") {
            matchesCategory = catLower.includes(cat.toLowerCase()) || text.includes(cat.toLowerCase());
          }

          // 3. City Filter
          const matchesCity = city === "All" || listingCity.toLowerCase() === city.toLowerCase();

          // 4. Occasion Filter
          const matchesOcc = occ === "All" || listingOcc.toLowerCase() === occ.toLowerCase();

          // 5. Size Filter
          const matchesSize = size === "All" || l.size === size || l.size === "Free";

          // 6. Distance Filter
          const matchesDistance = distanceKm <= maxKm;

          // 7. Trusted Filter
          const matchesTrusted = !trustedOnly || isVerified;

          // 8. Pincode Filter
          const matchesPincode = !pincode || listingPincode.includes(pincode.replace(/\D/g, ""));

          // 9. Search Term
          const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());

          // 10. Date Availability
          const matchesDate = !date || !isDateBlocked(l, date);

          return (
            matchesCollection &&
            matchesCategory &&
            matchesCity &&
            matchesOcc &&
            matchesSize &&
            matchesDistance &&
            matchesTrusted &&
            matchesPincode &&
            matchesSearch &&
            matchesDate
          );
        }
      ).sort((a, b) => {
        const aPrice = a.rentalPricePerDay || a.pricePerDay || 0;
        const bPrice = b.rentalPricePerDay || b.pricePerDay || 0;
        const aDist = a.distanceKm || 0;
        const bDist = b.distanceKm || 0;
        const aRating = a.ownerId?.rating || a.rating || 0;
        const bRating = b.ownerId?.rating || b.rating || 0;
        const aVerified = a.ownerId?.isVerified || a.verified;
        const bVerified = b.ownerId?.isVerified || b.verified;

        if (sort === "Price low") return aPrice - bPrice;
        if (sort === "Nearest") return aDist - bDist;
        if (sort === "Top rated") return bRating - aRating;
        return Number(bVerified) - Number(aVerified) || bRating - aRating;
      }),
    [apiListings, collection, cat, city, occ, size, maxKm, date, sort, trustedOnly, searchTerm, pincode],
  );

  useEffect(() => {
    if (loading) return;
    const filters = { collection, cat, city, occ, size, maxKm, trustedOnly, date: date?.toISOString(), searchTerm, pincode };
    trackEvent("filter_changed", filters);
    if (apiListings.length > 0 && filtered.length === 0) {
      trackEvent("zero_results", filters);
    }
  }, [collection, cat, city, occ, size, maxKm, trustedOnly, date, searchTerm, filtered.length, apiListings.length, loading]);

  const activeCount = [
    collection !== "All",
    searchTerm,
    cat !== "All",
    city !== "All",
    occ !== "All",
    size !== "All",
    maxKm !== 999,
    trustedOnly,
    !!date,
    pincode,
  ].filter(Boolean).length;

  const clearAll = () => {
    setCollection("All");
    setCat("All");
    setSearchTerm("");
    setPincode("");
    setCity("All");
    setOcc("All");
    setSize("All");
    setMaxKm(999);
    setDate(undefined);
    setSort("Recommended");
    setTrustedOnly(false);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search works best on Android Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setSearchTerm(transcript);
      trackEvent("filter_changed", { source: "voice_search", transcript });
    };
    recognition.start();
  };

  return (
    <div className="bg-background">
      {/* Header Section with Collection Tabs */}
      <section className="container-edit pt-12 md:pt-16 pb-8 border-b border-border">
        <p className="eyebrow flex items-center gap-2">
          <MapPin className="h-3 w-3" /> Bengaluru + Coimbatore / pincode search / 5 km radius
        </p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-4">
          <div>
            <h1 className="font-display text-4xl md:text-6xl text-ink leading-[1.05]">
              {filtered.length} outfits<br />
              <span className="italic text-primary">within walking distance.</span>
            </h1>
          </div>

          {/* Primary Collection Tabs */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary p-1.5 border border-border">
            {collections.map((item) => {
              const isActive = collection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCollection(item.id);
                    setCat("All");
                  }}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-background text-ink shadow-sm ring-1 ring-border font-semibold"
                      : "text-muted-foreground hover:text-ink"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Horizontal Filter Rail */}
      <section className="container-edit sticky top-16 z-30 border-b border-border bg-background/92 py-4 backdrop-blur md:top-20">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => scrollRail(-340)}
            aria-label="Scroll filters left"
            className="inline-flex shrink-0 items-center justify-center border border-border bg-background px-2 text-ink hover:border-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={railRef}
            className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground pr-3 border-r border-border">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters{activeCount > 0 && ` (${activeCount})`}</span>
            </div>

            {/* Search Input */}
            <div className="shrink-0 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search outfits or brands"
                className="w-36 bg-transparent text-xs outline-none"
              />
              <button
                type="button"
                aria-label="Voice search"
                onClick={startVoiceSearch}
                className={`rounded p-1 ${listening ? "bg-primary text-white" : "text-muted-foreground hover:text-ink"}`}
              >
                <Mic className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="shrink-0">
              <FilterRow label="Category" value={cat} setValue={setCat} options={activeCategoryList} />
            </div>

            {/* Occasion Filter */}
            <div className="shrink-0">
              <FilterRow label="Occasion" value={occ} setValue={setOcc} options={occasions} />
            </div>

            {/* City Filter */}
            <div className="shrink-0">
              <FilterRow label="City" value={city} setValue={setCity} options={cities} />
            </div>

            {/* Size Filter */}
            <div className="shrink-0">
              <FilterRow label="Size" value={size} setValue={setSize} options={sizes} />
            </div>

            {/* Distance Filter */}
            <div className="shrink-0">
              <FilterRow
                label="Distance"
                value={distances.find((d) => d.value === maxKm)?.label ?? "All"}
                setValue={(v) => setMaxKm(distances.find((d) => d.label === v)?.value ?? 999)}
                options={distances.map((d) => d.label)}
              />
            </div>

            {/* Sort */}
            <div className="shrink-0">
              <FilterRow label="Sort" value={sort} setValue={setSort} options={["Recommended", "Nearest", "Price low", "Top rated"]} />
            </div>

            {/* Trusted Only Toggle */}
            <button
              onClick={() => setTrustedOnly(!trustedOnly)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors",
                trustedOnly ? "bg-primary text-white border-primary" : "border-border text-ink hover:border-ink"
              )}
            >
              Trusted Only
            </button>

            {/* Pincode Search */}
            <div className="shrink-0 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={pincode}
                onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Pincode"
                inputMode="numeric"
                maxLength={6}
                className="w-24 bg-transparent text-xs outline-none"
              />
            </div>

            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors",
                    date ? "bg-ink text-cream border-ink" : "border-border text-ink hover:border-ink",
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {date ? format(date, "d MMM") : "Available on"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Clear All Button */}
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="shrink-0 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => scrollRail(340)}
            aria-label="Scroll filters right"
            className="inline-flex shrink-0 items-center justify-center border border-border bg-background px-2 text-ink hover:border-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Grid of Listings */}
      <section className="container-edit py-14">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading outfits...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <Sparkles className="mx-auto h-8 w-8 text-primary mb-3" />
            <p className="font-display text-2xl text-ink">No outfits match your filters</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try switching sections or resetting your distance and occasion filters.
            </p>
            <button onClick={clearAll} className="mt-5 btn-primary text-xs px-5 py-2.5">
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
            {filtered.map((l) => (
              <ListingCard key={l._id || l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterRow({
  label, value, setValue, options,
}: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs uppercase tracking-widest text-muted-foreground hidden sm:inline">{label}</span>
      <div className="flex gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => setValue(o)}
            className={`text-xs px-3 py-1.5 border transition-colors whitespace-nowrap ${
              value === o
                ? "bg-ink text-cream border-ink"
                : "border-border text-ink hover:border-ink"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
