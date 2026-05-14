"use client";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { Listing } from "@/lib/listings";
import { inr } from "@/lib/listings";

export function ListingCard({ listing, priority = false }: { listing: any; priority?: boolean }) {
  const isVerified = listing.ownerId?.isVerified || listing.verified;
  const image = listing.imageUrl || listing.imageData || listing.image || "/placeholder.jpg";
  const title = listing.name || listing.title;
  const price = listing.rentalPricePerDay || listing.pricePerDay;
  const rating = listing.ownerId?.rating || listing.rating || 4.5;
  const area = listing.area || 'Bengaluru';
  const size = listing.size;
  const category = listing.category;

  return (
    <Link href={`/listing/${listing._id || listing.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted shadow-sm transition-all duration-500 hover:shadow-2xl">
        <Image
          src={image}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {category && (
            <span className="backdrop-blur-md bg-white/20 border border-white/30 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm">
              {category}
            </span>
          )}
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-md backdrop-blur-md">
              <BadgeCheck className="h-3 w-3" /> Trusted Lender
            </span>
          )}
        </div>
        
        {/* Bottom Hover Actions */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex gap-2 w-full justify-between items-center">
             <div className="backdrop-blur-md bg-black/40 rounded-lg px-3 py-1.5 text-sm font-bold text-white shadow-sm border border-white/10">
               {price ? `₹${price.toLocaleString("en-IN")}` : '₹0'}<span className="font-normal text-white/70 text-xs">/day</span>
             </div>
             <div className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg backdrop-blur-md transition-colors">
               Rent Now
             </div>
          </div>
        </div>
      </div>

      <div className="pt-4 px-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-medium leading-tight text-ink transition-colors group-hover:text-primary">
              {title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {area}
            </p>
          </div>
          <div className="shrink-0 text-right">
             <div className="flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-ink">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {rating.toFixed(1)}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          Size {size}
        </p>
      </div>
    </Link>
  );
}
