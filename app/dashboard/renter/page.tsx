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

const inr = (value: number) => `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

export default function RenterDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "measurements">("orders");
  const [data, setData] = useState<{ rentals?: any[] }>({ rentals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
          <div className="border border-border border-dashed bg-secondary/30 p-12 text-center">
            <Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-ink">Coming soon</p>
            <p className="mt-1 text-sm text-muted-foreground">Saved outfits will appear here.</p>
          </div>
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
              {["Height (cm)", "Chest (cm)", "Waist (cm)", "Hips (cm)"].map((label) => (
                <div key={label} className="space-y-2">
                  <label className="text-sm font-medium">{label}</label>
                  <input type="number" className="w-full border border-border bg-background px-3 py-2 text-sm" />
                </div>
              ))}
            </div>
            <button className="btn-primary mt-6 w-full md:w-auto">Save measurements</button>
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
