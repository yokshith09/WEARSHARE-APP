import lehenga from "@/assets/hero-lehenga.jpg";
import saree from "@/assets/item-saree.jpg";
import sherwani from "@/assets/item-sherwani.jpg";
import anarkali from "@/assets/item-anarkali.jpg";
import cocktail from "@/assets/item-cocktail.jpg";
import bridal from "@/assets/item-bridal.jpg";
import kurta from "@/assets/item-kurta.jpg";

export type Listing = {
  id: string;
  title: string;
  category: string;
  occasion: string;
  size: string;
  pricePerDay: number;
  retailPrice: number;
  deposit: number;
  image: string;
  lister: string;
  area: string;
  city: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  verified: boolean;
  fitScore: number;
  unavailableDates?: string[];
  reviewItems?: { author: string; rating: number; date: string; text: string }[];
};

const today = new Date();
const iso = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const blockedDates = [iso(2), iso(3), iso(7), iso(8), iso(15), iso(20), iso(21)];
const sampleReviews = [
  { author: "Anita R.", rating: 5, date: "Last month", text: "Pristine condition and the fit was spot-on. Pickup was effortless." },
  { author: "Sneha P.", rating: 5, date: "2 months ago", text: "Got compliments all evening. The lister was responsive and warm." },
  { author: "Vikram J.", rating: 4, date: "3 months ago", text: "Beautiful piece. Slightly tighter than expected, but tailorable on the day." },
];

export const listings: Listing[] = [
  {
    id: "emerald-lehenga",
    title: "Emerald Silk Lehenga",
    category: "Lehenga",
    occasion: "Wedding",
    size: "M",
    pricePerDay: 1800,
    retailPrice: 38000,
    deposit: 6000,
    image: (lehenga as any).src || lehenga,
    lister: "Deepa M.",
    area: "Indiranagar",
    city: "Bengaluru",
    distanceKm: 2.4,
    rating: 4.9,
    reviews: 38,
    verified: true,
    fitScore: 94,
  },
  {
    id: "kanjivaram-saree",
    title: "Kanjivaram Silk Saree",
    category: "Saree",
    occasion: "Reception",
    size: "Free",
    pricePerDay: 1200,
    retailPrice: 24000,
    deposit: 4000,
    image: (saree as any).src || saree,
    lister: "Lakshmi R.",
    area: "Koramangala",
    city: "Bengaluru",
    distanceKm: 3.1,
    rating: 4.8,
    reviews: 22,
    verified: true,
    fitScore: 99,
  },
  {
    id: "navy-sherwani",
    title: "Navy Embroidered Sherwani",
    category: "Sherwani",
    occasion: "Wedding",
    size: "L",
    pricePerDay: 1500,
    retailPrice: 32000,
    deposit: 5000,
    image: (sherwani as any).src || sherwani,
    lister: "Rahul S.",
    area: "HSR Layout",
    city: "Bengaluru",
    distanceKm: 4.6,
    rating: 4.7,
    reviews: 14,
    verified: true,
    fitScore: 88,
  },
  {
    id: "blush-anarkali",
    title: "Blush Chikankari Anarkali",
    category: "Anarkali",
    occasion: "Sangeet",
    size: "S",
    pricePerDay: 950,
    retailPrice: 18500,
    deposit: 3000,
    image: (anarkali as any).src || anarkali,
    lister: "Priya K.",
    area: "Jayanagar",
    city: "Bengaluru",
    distanceKm: 5.2,
    rating: 4.9,
    reviews: 51,
    verified: true,
    fitScore: 92,
  },
  {
    id: "black-sequin",
    title: "Black Sequin Cocktail Gown",
    category: "Gown",
    occasion: "Cocktail",
    size: "M",
    pricePerDay: 850,
    retailPrice: 15000,
    deposit: 2500,
    image: (cocktail as any).src || cocktail,
    lister: "Anjali T.",
    area: "Whitefield",
    city: "Bengaluru",
    distanceKm: 8.4,
    rating: 4.6,
    reviews: 19,
    verified: false,
    fitScore: 90,
  },
  {
    id: "ivory-bridal",
    title: "Ivory Gold Bridal Anarkali",
    category: "Anarkali",
    occasion: "Wedding",
    size: "M",
    pricePerDay: 2400,
    retailPrice: 52000,
    deposit: 8000,
    image: (bridal as any).src || bridal,
    lister: "Meera J.",
    area: "Indiranagar",
    city: "Bengaluru",
    distanceKm: 2.1,
    rating: 5.0,
    reviews: 12,
    verified: true,
    fitScore: 96,
  },
  {
    id: "teal-kurta",
    title: "Teal Silk Kurta Set",
    category: "Kurta",
    occasion: "Festival",
    size: "M",
    pricePerDay: 600,
    retailPrice: 9500,
    deposit: 1500,
    image: (kurta as any).src || kurta,
    lister: "Karan V.",
    area: "Koramangala",
    city: "Bengaluru",
    distanceKm: 3.4,
    rating: 4.7,
    reviews: 28,
    verified: true,
    fitScore: 91,
  },
].map((listing, index) => ({
  ...listing,
  unavailableDates: blockedDates.slice(index % 3, (index % 3) + 4),
  reviewItems: sampleReviews,
}));

export const getListing = (id: string) => listings.find((listing) => listing.id === id);

export const inr = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

export const isDateBlocked = (listing: Listing, date: Date) =>
  (listing.unavailableDates ?? []).includes(date.toISOString().slice(0, 10));
