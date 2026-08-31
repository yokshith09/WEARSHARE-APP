"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, Clock, Heart, History, Package, RotateCcw, Ruler, ShoppingBag } from "lucide-react";

const statusSteps = [
  { id: "requested", label: "Requested", icon: Clock },
  { id: "approved", label: "Approved", icon: Check },
  { id: "picked_up", label: "Picked up", icon: Package },
  { id: "returned", label: "Returned", icon: RotateCcw },
];

const statusRank: Record<string, number> = {
  requested: 0,
  approved: 1,
  picked_up: 2,
  returned: 3,
};

const measurementFields = [
  ["height", "Height (cm)"],
  ["chest", "Chest (cm)"],
  ["waist", "Waist (cm)"],
  ["hips", "Hips (cm)"],
] as const;

const inr = (value: number) => `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

export default function RenterDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "measurements">("orders");
  const [data, setData] = useState<{ rentals?: any[] }>({ rentals: [] });
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [measurementMessage, setMeasurementMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((res) => (res.ok ? res.json() : { rentals: [] })).catch(() => ({ rentals: [] })),
      fetch("/api/wishlist").then((res) => (res.ok ? res.json() : { wishlist: [] })).catch(() => ({ wishlist: [] })),
      fetch("/api/profile").then((res) => (res.ok ? res.json() : null)).catch(() => null),
    ])
      .then(([bookingData, wishlistData, profileData]: [any, any, { measurements?: Record<string, string> } | null]) => {
        setData(bookingData?.rentals ? bookingData : { rentals: [] });
        setWishlist(Array.isArray(wishlistData?.wishlist) ? wishlistData.wishlist : []);
        setMeasurements(profileData?.measurements || {});
      })
      .finally(() => setLoading(false));
  }, []);

  const saveMeasurements = async () => {
    setSavingMeasurements(true);
    setMeasurementMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurements }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Unable to save measurements");
      setMeasurementMessage("Measurements saved.");
    } catch (error) {
      setMeasurementMessage(error instanceof Error ? error.message : "Unable to save measurements");
    } finally {
      setSavingMeasurements(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading your rentals...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-3 overflow-x-auto pb-2">
        <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")} icon={History}>
          Orders & returns
        </TabButton>
        <TabButton active={activeTab === "wishlist"} onClick={() => setActiveTab("wishlist")} icon={Heart}>
          Wishlist
        </TabButton>
        <TabButton active={activeTab === "measurements"} onClick={() => setActiveTab("measurements")} icon={Ruler}>
          Measurements
        </TabButton>
      </div>

      {activeTab === "orders" && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl">Your bookings</h2>
          {(!data?.rentals || data.rentals.length === 0) ? (
            <div className="border border-border border-dashed bg-secondary/30 p-12 text-center">
              <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-ink">No rentals yet</p>
              <p className="mb-6 mt-1 text-sm text-muted-foreground">Find an outfit and confirm your first rental.</p>
              <Link href="/browse" className="btn-primary">Browse outfits</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(data?.rentals || []).map((booking) => (
                <div key={booking.id} className="border border-border bg-card p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <img
                      src={booking.listingImage || "/placeholder.jpg"}
                      alt={booking.listingName}
                      className="h-24 w-20 shrink-0 bg-muted object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-medium text-ink">{booking.listingName}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {booking.rentalStart} to {booking.rentalEnd}
                          </p>
                        </div>
                        <span className="bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-4 border-t border-border pt-4">
                        <BookingTimeline status={booking.status} />
                        <p className="mt-3 text-xs text-muted-foreground">
                          Deposit held: {inr(booking.securityDeposit)} / Handover photos and return confirmation are tracked in logistics.
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                      <p className="text-lg font-semibold text-ink">{inr(booking.totalAmount)}</p>
                      <Link
                        href={`/trips/${booking.id}?role=renter`}
                        className="bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
                      >
                        Open logistics
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "wishlist" && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl">Your wishlist</h2>
          {wishlist.length === 0 ? (
            <div className="border border-border border-dashed bg-secondary/30 p-12 text-center">
              <Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-ink">No saved outfits yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Browse pieces you love and save them here for later.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {wishlist.map((item) => (
                <Link key={item.id} href={`/listing/${item.id}`} className="flex gap-4 border border-border bg-card p-4 transition-colors hover:border-ink">
                  <img
                    src={item.image_url || item.imageUrl || item.image || "/placeholder.jpg"}
                    alt={item.title || item.name}
                    className="h-24 w-20 shrink-0 bg-muted object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{item.title || item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.category || "Outfit"} / Size {item.size || "Free"}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-ink">{inr(item.rental_price_per_day || item.rentalPricePerDay || item.pricePerDay || 0)}/day</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "measurements" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Smart sizing profile</h2>
            <span className="bg-primary px-3 py-1 text-xs font-medium text-white">AI match enabled</span>
          </div>
          <div className="border border-border bg-card p-6">
            <p className="mb-6 text-sm text-muted-foreground">Enter measurements to improve fit predictions on outfits.</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {measurementFields.map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium">{label}</label>
                  <input
                    type="number"
                    className="w-full border border-border bg-background px-3 py-2 text-sm"
                    value={measurements[key] || ""}
                    onChange={(event) => setMeasurements((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={saveMeasurements} disabled={savingMeasurements} className="btn-primary w-full md:w-auto">
                {savingMeasurements ? "Saving..." : "Save measurements"}
              </button>
              {measurementMessage && <p className="text-sm text-muted-foreground">{measurementMessage}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: any; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-primary text-white" : "bg-secondary text-ink hover:bg-secondary/80"
      }`}
    >
      <Icon className="mr-2 inline-block h-4 w-4" />
      {children}
    </button>
  );
}

function BookingTimeline({ status }: { status: string }) {
  const current = statusRank[status] ?? 0;
  return (
    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
      {statusSteps.map((step, index) => {
        const Icon = step.icon;
        const done = index <= current;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              <Icon className="h-3 w-3" />
            </span>
            <span className={done ? "text-ink" : "text-muted-foreground"}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
