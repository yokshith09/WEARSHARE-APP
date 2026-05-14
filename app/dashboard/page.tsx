"use client";
import Link from "next/link";

import { useMemo, useState } from "react";
import {
  TrendingUp, Wallet, Calendar as CalIcon, RotateCw, ArrowUpRight, BadgeCheck, Clock, Filter, X, Check, Sparkles,
} from "lucide-react";
import { listings, inr, type Listing } from "@/lib/listings";



type HistoryRow = {
  id: string; item: Listing; renter: string; from: string; to: string; days: number;
  status: "Paid" | "In review" | "Refunded"; amount: number; monthKey: string;
};

export default function Dashboard() {
  const myListings = listings.slice(0, 4);
  const totalEarned = 48650;
  const pending = 8400;
  const nextPayoutDate = "21 May 2026";

  const payouts = [
    { date: "21 May", amount: 8400, status: "Scheduled" as const, count: 3, eta: "Wed, 21 May / before 6 PM" },
    { date: "14 May", amount: 6200, status: "Paid" as const, count: 2, eta: "Settled 14 May" },
    { date: "7 May", amount: 9800, status: "Paid" as const, count: 4, eta: "Settled 7 May" },
    { date: "30 Apr", amount: 5400, status: "Paid" as const, count: 2, eta: "Settled 30 Apr" },
  ];

  const history: HistoryRow[] = [
    { id: "ws-1841", item: myListings[0], renter: "Anita R.", from: "12 Apr", to: "14 Apr", days: 3, status: "Paid", amount: 5400, monthKey: "Apr" },
    { id: "ws-1837", item: myListings[1], renter: "Sneha P.", from: "5 Apr", to: "6 Apr", days: 2, status: "Paid", amount: 2400, monthKey: "Apr" },
    { id: "ws-1822", item: myListings[2], renter: "Vikram J.", from: "28 Mar", to: "30 Mar", days: 3, status: "Paid", amount: 4500, monthKey: "Mar" },
    { id: "ws-1819", item: myListings[0], renter: "Riya K.", from: "20 Mar", to: "22 Mar", days: 3, status: "In review", amount: 5400, monthKey: "Mar" },
    { id: "ws-1810", item: myListings[3], renter: "Tanya S.", from: "12 Mar", to: "13 Mar", days: 2, status: "Paid", amount: 1900, monthKey: "Mar" },
    { id: "ws-1801", item: myListings[1], renter: "Shreya N.", from: "2 Feb", to: "3 Feb", days: 2, status: "Refunded", amount: 0, monthKey: "Feb" },
  ];

  // Filters
  const [statusFilter, setStatusFilter] = useState<"All" | HistoryRow["status"]>("All");
  const [monthFilter, setMonthFilter] = useState<"All" | string>("All");
  const [itemFilter, setItemFilter] = useState<"All" | string>("All");

  const filtered = useMemo(
    () =>
      history.filter(
        (h) =>
          (statusFilter === "All" || h.status === statusFilter) &&
          (monthFilter === "All" || h.monthKey === monthFilter) &&
          (itemFilter === "All" || h.item.id === itemFilter),
      ),
    [history, statusFilter, monthFilter, itemFilter],
  );

  const months = Array.from(new Set(history.map((h) => h.monthKey)));

  // Relist editor
  const [relistOpen, setRelistOpen] = useState<Listing | null>(null);
  const lastListed = myListings[0];

  return (
    <div className="bg-background">
      <section className="container-edit pt-12 pb-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="eyebrow">Lister dashboard</p>
            <h1 className="font-display text-4xl md:text-5xl mt-3 text-ink leading-tight">Welcome back, Deepa</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your wardrobe earned more than your last month's brunch budget.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRelistOpen(lastListed)}
              className="inline-flex items-center gap-2 text-sm font-medium border border-ink text-ink px-5 py-3 hover:bg-ink hover:text-cream transition"
            >
              <Sparkles className="h-4 w-4" /> Relist last item
            </button>
            <Link
              href="/list-item"
              className="inline-flex items-center gap-2 text-sm font-medium bg-ink text-cream px-5 py-3 hover:bg-primary transition"
            >
              List new outfit <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-10 grid md:grid-cols-4 gap-4">
          <Kpi icon={Wallet} label="Total earned" value={inr(totalEarned)} sub="Lifetime, after fees" />
          <Kpi icon={Clock} label="Pending payout" value={inr(pending)} sub={`Next on ${nextPayoutDate}`} accent />
          <Kpi icon={CalIcon} label="Active rentals" value="3" sub="2 returns due this week" />
          <Kpi icon={TrendingUp} label="Avg. occupancy" value="42%" sub="+8% vs. last month" />
        </div>
      </section>

      {/* Payouts */}
      <section className="container-edit py-10 hairline">
        <div className="grid md:grid-cols-12 gap-10 mt-10">
          <div className="md:col-span-4">
            <p className="eyebrow">Payout schedule</p>
            <h2 className="font-display text-3xl mt-3 text-ink">Weekly to your bank.</h2>
            <p className="text-sm text-muted-foreground mt-3">
              Earnings settle 24h after each return clears. Payouts auto-transfer every Wednesday to HDFC ****4421.
            </p>
            <div className="mt-5 border border-primary/30 bg-primary/5 p-4">
              <p className="eyebrow text-primary">Next payout</p>
              <p className="font-display text-2xl text-ink mt-2">{inr(pending)}</p>
              <p className="text-xs text-muted-foreground mt-1">{nextPayoutDate} / 3 rentals bundled</p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Scheduled / in 9 days
              </div>
            </div>
            <button className="mt-5 text-xs border border-ink text-ink px-4 py-2 hover:bg-ink hover:text-cream transition">
              Manage bank details
            </button>
          </div>
          <div className="md:col-span-8 border border-border">
            <div className="px-5 py-3 border-b border-border bg-secondary/40 grid grid-cols-12 text-[10px] uppercase tracking-widest text-muted-foreground">
              <div className="col-span-3">Date</div>
              <div className="col-span-5">Details</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {payouts.map((p, i) => (
              <div key={i} className="px-5 py-4 border-b border-border last:border-0 grid grid-cols-12 items-center gap-2">
                <div className="col-span-3">
                  <p className="text-sm text-ink font-medium">{p.date}</p>
                  <p className="text-[11px] text-muted-foreground">{p.count} rentals</p>
                </div>
                <div className="col-span-5">
                  <p className="text-xs text-muted-foreground">{p.eta}</p>
                  <p className="text-[11px] text-muted-foreground">HDFC Bank ****4421 / UPI fallback active</p>
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 ${
                      p.status === "Paid" ? "bg-secondary text-ink" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {p.status === "Paid" ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {p.status}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <p className="font-display text-lg text-ink">{inr(p.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* My listings - relist quick action */}
      <section className="container-edit py-12 hairline">
        <div className="flex items-end justify-between flex-wrap gap-3 mt-10">
          <div>
            <p className="eyebrow">Your wardrobe</p>
            <h2 className="font-display text-3xl mt-3 text-ink">Your listings</h2>
          </div>
          <p className="text-xs text-muted-foreground">Relist opens an editor prefilled from this piece.</p>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {myListings.map((l) => (
            <div key={l.id} className="border border-border group">
              <Link href={`/listing/${l.id}`} className="block aspect-[4/5] overflow-hidden bg-muted">
                <img src={l.image} alt={l.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </Link>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink font-medium truncate">{l.title}</p>
                  {l.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{inr(l.pricePerDay)}/day / {l.reviews} rentals</p>
                <button
                  onClick={() => setRelistOpen(l)}
                  className="mt-4 w-full text-xs border border-ink text-ink py-2 hover:bg-ink hover:text-cream transition flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="h-3 w-3" /> Relist / edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rental history */}
      <section className="container-edit py-12 pb-24">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow">Activity</p>
            <h2 className="font-display text-3xl mt-3 text-ink">Rental history</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              options={["All", "Paid", "In review", "Refunded"]}
            />
            <FilterSelect
              label="Month"
              value={monthFilter}
              onChange={setMonthFilter}
              options={["All", ...months]}
            />
            <FilterSelect
              label="Item"
              value={itemFilter}
              onChange={setItemFilter}
              options={["All", ...myListings.map((l) => l.id)]}
              labelMap={Object.fromEntries(myListings.map((l) => [l.id, l.title]))}
            />
            {(statusFilter !== "All" || monthFilter !== "All" || itemFilter !== "All") && (
              <button
                onClick={() => { setStatusFilter("All"); setMonthFilter("All"); setItemFilter("All"); }}
                className="text-muted-foreground hover:text-ink inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
        <div className="mt-6 border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Renter</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Earned</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">No rentals match these filters.</td></tr>
              ) : filtered.map((h) => (
                <tr key={h.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="px-5 py-4 text-ink font-mono text-xs">{h.id.toUpperCase()}</td>
                  <td className="px-5 py-4 text-ink">{h.item.title}</td>
                  <td className="px-5 py-4 text-muted-foreground">{h.renter}</td>
                  <td className="px-5 py-4 text-muted-foreground">{h.from} to {h.to} / {h.days}d</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center text-[11px] px-2 py-0.5 ${
                      h.status === "Paid" ? "bg-secondary text-ink" :
                      h.status === "In review" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink font-medium text-right">{inr(h.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {relistOpen && <RelistEditor listing={relistOpen} onClose={() => setRelistOpen(null)} />}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options, labelMap,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; labelMap?: Record<string, string> }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="hidden sm:inline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border bg-background px-2 py-1 text-ink"
      >
        {options.map((o) => (
          <option key={o} value={o}>{labelMap?.[o] ?? o}</option>
        ))}
      </select>
    </label>
  );
}

function Kpi({
  icon: Icon, label, value, sub, accent,
}: { icon: typeof TrendingUp; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`border p-5 ${accent ? "border-primary bg-primary/5" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="font-display text-3xl text-ink mt-3">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function RelistEditor({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [title, setTitle] = useState(listing.title);
  const [pricePerDay, setPricePerDay] = useState(listing.pricePerDay);
  const [deposit, setDeposit] = useState(listing.deposit);
  const [duration, setDuration] = useState(30);
  const [done, setDone] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div
        className="bg-background w-full md:max-w-lg border border-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="eyebrow">Relist editor</p>
            <p className="text-sm text-ink font-medium mt-1">Prefilled from your last item</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-display text-2xl mt-5 text-ink">Relisted for {duration} days</h3>
            <p className="mt-2 text-sm text-muted-foreground">{title} is live again. Renters in your area will see it now.</p>
            <button onClick={onClose} className="mt-6 border border-ink text-ink px-5 py-2 text-sm hover:bg-ink hover:text-cream transition">Done</button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setDone(true); }}
            className="p-5 space-y-5"
          >
            <div className="flex gap-4">
              <div className="h-24 w-20 overflow-hidden bg-muted shrink-0">
                <img src={listing.image} alt={listing.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="eyebrow">Title</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input mt-1.5" />
                </label>
                <p className="text-[11px] text-muted-foreground mt-2">Originally {listing.category} / size {listing.size}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Price / day</span>
                <input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(Number(e.target.value))} className="form-input mt-1.5" />
              </label>
              <label className="block">
                <span className="eyebrow">Deposit</span>
                <input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="form-input mt-1.5" />
              </label>
            </div>

            <div>
              <p className="eyebrow">Open availability for</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[15, 30, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`text-xs py-2 border ${duration === d ? "bg-ink text-cream border-ink" : "border-border text-ink hover:border-ink"}`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-primary/30 bg-primary/5 p-3 text-[11px] text-muted-foreground flex gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <span>Prices stay competitive in your area. You can pause anytime from this dashboard.</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 border border-border text-ink py-2.5 text-sm hover:bg-secondary">Cancel</button>
              <button type="submit" className="flex-1 bg-ink text-cream py-2.5 text-sm hover:bg-primary transition inline-flex items-center justify-center gap-1.5">
                <RotateCw className="h-3.5 w-3.5" /> Relist now
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
