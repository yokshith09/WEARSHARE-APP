"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  CalendarClock,
  Check,
  Clock,
  History,
  Inbox,
  Plus,
  RefreshCcw,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import dynamic from "next/dynamic";

const EarningsChart = dynamic(() => import("@/components/earnings-chart"), { ssr: false });

const statusLabels: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  picked_up: "Picked up",
  returned: "Returned",
  declined: "Declined",
  maintenance: "Maintenance",
};

const inr = (value: number) => `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

export default function ListerDashboard() {
  const [activeTab, setActiveTab] = useState<"inventory" | "earnings" | "requests">("inventory");
  const [data, setData] = useState<{ lending?: any[] }>({ lending: [] });
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/bookings").then((res) => res.json()).catch(() => ({ lending: [] })),
      fetch("/api/listings?mine=1").then((res) => res.json()).catch(() => []),
      fetch("/api/listings").then((res) => res.json()).catch(() => []),
    ])
      .then(([bookingData, myListings, allListings]) => {
        setData(bookingData || { lending: [] });
        const userItems = Array.isArray(myListings) && myListings.length > 0
          ? myListings
          : (Array.isArray(allListings) ? allListings : []);
        setListings(userItems);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const lending = data?.lending || [];
  const pendingRequests = lending.filter((b) => b.status === "requested");
  const activeRentals = lending.filter((b) => ["approved", "picked_up"].includes(b.status));
  const rentalHistory = lending.filter((b) => ["returned", "declined", "maintenance"].includes(b.status));
  const totalEarnings = lending.reduce((sum, b) => sum + Number(b.listerEarnings || 0), 0);
  const pendingPayout = lending
    .filter((b) => b.status === "returned" && b.paymentStatus === "paid")
    .reduce((sum, b) => sum + Number(b.listerEarnings || 0), 0);
  const upcomingPayout = lending
    .filter((b) => ["approved", "picked_up"].includes(b.status))
    .reduce((sum, b) => sum + Number(b.listerEarnings || 0), 0);

  const earningsData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((name, index) => ({
      name,
      earnings: index === months.length - 1 ? totalEarnings : Math.round(totalEarnings * (index / 10)),
    }));
  }, [totalEarnings]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/bookings/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, deliveryStatus: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Unable to update booking");
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to update booking");
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric title="Listed items" value={String(listings.length)} icon={Tag} />
        <Metric title="Active rentals" value={String(activeRentals.length)} icon={CalendarClock} />
        <Metric title="Pending payout" value={inr(pendingPayout)} icon={Wallet} />
        <Metric title="Lifetime earnings" value={inr(totalEarnings)} icon={TrendingUp} />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <TabButton active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")} icon={Tag}>
          Inventory
        </TabButton>
        <TabButton active={activeTab === "earnings"} onClick={() => setActiveTab("earnings")} icon={Wallet}>
          Earnings & payouts
        </TabButton>
        <TabButton active={activeTab === "requests"} onClick={() => setActiveTab("requests")} icon={Inbox}>
          Rental requests
        </TabButton>
      </div>

      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Inventory</h2>
            <Link href="/list-item" className="btn-primary inline-flex h-10 items-center gap-2">
              <Plus className="h-4 w-4" /> Add listing
            </Link>
          </div>

          <div className="grid gap-4">
            {listings.length === 0 ? (
              <EmptyState icon={Archive} title="No listed items yet" body="List your first outfit to start accepting rental requests." />
            ) : (
              listings.map((listing) => (
                <div key={listing.id || listing._id} className="border border-border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={listing.imageUrl || listing.image || "/placeholder.jpg"}
                      alt={listing.title || listing.name}
                      className="h-20 w-16 bg-muted object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{listing.title || listing.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {listing.category} / Size {listing.size} / {inr(listing.rentalPricePerDay || listing.pricePerDay)}/day
                      </p>
                      <p className="mt-1 text-xs text-primary">
                        Expected payout per rental day: {inr(Number(listing.rentalPricePerDay || listing.pricePerDay || 0) * 0.85)}
                      </p>
                    </div>
                    <Link
                      href={`/list-item?relist=${listing.id || listing._id}`}
                      className="inline-flex shrink-0 items-center gap-1 border border-ink px-3 py-2 text-xs text-ink hover:bg-ink hover:text-cream"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" /> Relist
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "earnings" && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Earnings overview</h2>
              <span className="text-xs text-muted-foreground">85% lister payout after platform fee</span>
            </div>
            <div className="mt-6 h-[300px]">
              <EarningsChart data={earningsData} />
            </div>
          </div>

          <div className="lg:col-span-4 border border-border bg-card p-6">
            <h3 className="font-display text-xl">Payout schedule</h3>
            <div className="mt-5 space-y-4">
              <PayoutRow title="Available after return" amount={pendingPayout} note="Moves to your bank/UPI within 48 hours." />
              <PayoutRow title="Upcoming rentals" amount={upcomingPayout} note="Pending pickup and successful return." />
              <PayoutRow title="Platform fee" amount={Math.round(totalEarnings * 0.1765)} note="Approx. 15% of rental subtotal." />
            </div>
          </div>

          <div className="lg:col-span-12 border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-display text-xl">Rental history</h3>
            </div>
            <BookingList bookings={rentalHistory.length ? rentalHistory : lending} empty="No rental history yet." />
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-5">
          <h2 className="font-display text-2xl">Rental requests</h2>
          {pendingRequests.length === 0 ? (
            <EmptyState icon={Inbox} title="No pending requests" body="New paid requests and renter questions will appear here." />
          ) : (
            pendingRequests.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                primary={{ label: "Approve", onClick: () => handleStatusChange(booking.id, "approved") }}
                secondary={{ label: "Decline", onClick: () => handleStatusChange(booking.id, "declined") }}
              />
            ))
          )}
          {activeRentals.length > 0 && (
            <>
              <h3 className="font-display text-xl pt-4">Active logistics</h3>
              {activeRentals.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  primary={{
                    label: booking.status === "approved" ? "Confirm pickup" : "Confirm return",
                    onClick: () => handleStatusChange(booking.id, booking.status === "approved" ? "picked_up" : "returned"),
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="border border-border bg-card p-5">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-3 text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
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

function PayoutRow({ title, amount, note }: { title: string; amount: number; note: string }) {
  return (
    <div className="border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-sm font-semibold text-primary">{inr(amount)}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function BookingList({ bookings, empty }: { bookings: any[]; empty: string }) {
  if (!bookings.length) return <div className="p-8 text-center text-sm text-muted-foreground">{empty}</div>;
  return (
    <div className="divide-y divide-border">
      {bookings.map((booking) => (
        <div key={booking.id} className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p className="font-medium text-ink">{booking.listingName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {booking.rentalStart} to {booking.rentalEnd} / {statusLabels[booking.status] || booking.status}
            </p>
          </div>
          <p className="text-ink">{inr(booking.listerEarnings)}</p>
          <Link href={`/trips/${booking.id}?role=lister`} className="text-xs text-primary hover:underline">
            Open logistics
          </Link>
        </div>
      ))}
    </div>
  );
}

function BookingCard({
  booking,
  primary,
  secondary,
}: {
  booking: any;
  primary?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <img src={booking.listingImage || "/placeholder.jpg"} alt={booking.listingName} className="h-20 w-16 bg-muted object-cover" />
        <div className="flex-1">
          <p className="font-medium text-ink">{booking.listingName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {booking.rentalStart} to {booking.rentalEnd} / Deposit {inr(booking.securityDeposit)}
          </p>
          <p className="mt-1 text-xs text-primary">Your payout: {inr(booking.listerEarnings)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/trips/${booking.id}?role=lister`} className="border border-border px-4 py-2 text-xs text-ink hover:bg-secondary">
            Logistics
          </Link>
          {secondary && (
            <button onClick={secondary.onClick} className="border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 hover:bg-red-100">
              {secondary.label}
            </button>
          )}
          {primary && (
            <button onClick={primary.onClick} className="bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90">
              {primary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="border border-dashed border-border bg-secondary/30 p-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-4 font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
