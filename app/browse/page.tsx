"use client";

import { Suspense } from "react";
import { useEffect, useState, useMemo } from "react";
import { SlidersHorizontal, MapPin, CalendarIcon, X, Mic, Search } from "lucide-react";
import { format } from "date-fns";
import { isDateBlocked } from "@/lib/listings";
import { ListingCard } from "@/components/listing-card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

const categories = ["All", "Lehenga", "Saree", "Sherwani", "Anarkali", "Gown", "Kurta", "Suit", "Indo-Western", "Blazer", "Tuxedo", "Co-ord Set", "Dhoti", "Accessories", "Shirt", "Pant"];
const occasions = ["All", "Wedding", "Reception", "Sangeet", "Cocktail", "Festival"];
const sizes = ["All", "XS", "S", "M", "L", "XL", "Free"];
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

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const categoryFromQuery =
    initialCategory === "men" ? "Sherwani" :
    initialCategory === "women" ? "Lehenga" :
    initialCategory === "accessories" ? "All" :
    "All";

  const [cat, setCat] = useState(categoryFromQuery);
  const [occ, setOcc] = useState("All");
  const [size, setSize] = useState("All");
  const [maxKm, setMaxKm] = useState(999);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [sort, setSort] = useState("Recommended");
  const [searchTerm, setSearchTerm] = useState("");
  const [listening, setListening] = useState(false);
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [apiListings, setApiListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        setApiListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      apiListings.filter(
        (l) => {
          const isVerified = l.ownerId?.isVerified || l.verified;
          const listingCat = l.category || 'All';
          const listingOcc = l.occasion || 'All';
          const distanceKm = l.distanceKm || 0;
          const text = `${l.title || l.name || ""} ${l.description || ""} ${listingCat} ${listingOcc}`.toLowerCase();
          return (cat === "All" || listingCat.toLowerCase() === cat.toLowerCase()) &&
                 (occ === "All" || listingOcc.toLowerCase() === occ.toLowerCase()) &&
                 (size === "All" || l.size === size) &&
                 distanceKm <= maxKm &&
                 (!trustedOnly || isVerified) &&
                 (!searchTerm || text.includes(searchTerm.toLowerCase())) &&
                 (!date || !isDateBlocked(l, date));
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
    [apiListings, cat, occ, size, maxKm, date, sort, trustedOnly, searchTerm],
  );

  useEffect(() => {
    if (loading) return;
    const filters = { cat, occ, size, maxKm, trustedOnly, date: date?.toISOString(), searchTerm };
    trackEvent("filter_changed", filters);
    if (apiListings.length > 0 && filtered.length === 0) {
      trackEvent("zero_results", filters);
    }
  }, [cat, occ, size, maxKm, trustedOnly, date, searchTerm, filtered.length, apiListings.length, loading]);

  const activeCount = [
    searchTerm,
    cat !== "All",
    occ !== "All",
    size !== "All",
    maxKm !== 999,
    trustedOnly,
    !!date,
  ].filter(Boolean).length;

  const clearAll = () => {
    setSearchTerm(""); setCat("All"); setOcc("All"); setSize("All"); setMaxKm(999); setDate(undefined); setSort("Recommended"); setTrustedOnly(false);
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
      <section className="container-edit pt-12 md:pt-16 pb-10 border-b border-border">
        <p className="eyebrow flex items-center gap-2"><MapPin className="h-3 w-3" /> Bengaluru / 560038 / 5 km radius</p>
        <h1 className="font-display text-4xl md:text-6xl mt-4 text-ink leading-[1.05]">
          {filtered.length} outfits<br />
          <span className="italic text-primary">within walking distance.</span>
        </h1>
      </section>

      <section className="container-edit sticky top-16 z-30 border-b border-border bg-background/92 py-4 backdrop-blur md:top-20">
        <div className="flex items-center gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground pr-3 border-r border-border">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters{activeCount > 0 && ` (${activeCount})`}</span>
          </div>
          <div className="shrink-0 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search outfits"
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
          <FilterRow label="Occasion" value={occ} setValue={setOcc} options={occasions} />
          <FilterRow label="Category" value={cat} setValue={setCat} options={categories} />
          <FilterRow label="Size" value={size} setValue={setSize} options={sizes} />
          <FilterRow
            label="Distance"
            value={distances.find((d) => d.value === maxKm)?.label ?? "All"}
            setValue={(v) => setMaxKm(distances.find((d) => d.label === v)?.value ?? 999)}
            options={distances.map((d) => d.label)}
          />
          <FilterRow label="Sort" value={sort} setValue={setSort} options={["Recommended", "Nearest", "Price low", "Top rated"]} />

          <button
            onClick={() => setTrustedOnly(!trustedOnly)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors",
              trustedOnly ? "bg-primary text-white border-primary" : "border-border text-ink hover:border-ink"
            )}
          >
            Trusted Only
          </button>

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

          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
      </section>

      <section className="container-edit py-14">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading outfits...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-foreground">
              No outfits match - try widening your filters.
            </p>
            <button onClick={clearAll} className="mt-4 text-sm text-primary underline">Reset filters</button>
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
