"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Ruler, History, Heart, ArrowRight } from "lucide-react";

export default function RenterDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "measurements">("orders");
  const [data, setData] = useState({ rentals: [] });
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
      {/* Renter Sub-Navigation */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "orders" ? "bg-primary text-white" : "bg-secondary text-ink hover:bg-secondary/80"
          }`}
        >
          <History className="h-4 w-4 inline-block mr-2" />
          Orders & Returns
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "wishlist" ? "bg-primary text-white" : "bg-secondary text-ink hover:bg-secondary/80"
          }`}
        >
          <Heart className="h-4 w-4 inline-block mr-2" />
          Wishlist
        </button>
        <button
          onClick={() => setActiveTab("measurements")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "measurements" ? "bg-primary text-white" : "bg-secondary text-ink hover:bg-secondary/80"
          }`}
        >
          <Ruler className="h-4 w-4 inline-block mr-2" />
          Measurements
        </button>
      </div>

      {activeTab === "orders" && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl">Your Orders</h2>
          {(!data?.rentals || data.rentals.length === 0) ? (
            <div className="border border-border border-dashed rounded-xl p-12 text-center bg-secondary/30">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-ink">No rentals yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">You haven't rented any outfits yet.</p>
              <Link href="/browse" className="btn-primary">Browse Outfits</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(data?.rentals || []).map((booking: any) => (
                <div key={booking.id} className="border border-border rounded-xl p-5 bg-card flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="h-24 w-20 bg-muted rounded-md overflow-hidden shrink-0">
                    <img src={booking.listingImage || "/placeholder.jpg"} alt={booking.listingName} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-ink text-lg">{booking.listingName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">Rental Period: {booking.rentalStart} to {booking.rentalEnd}</p>
                      </div>
                      <span className="text-xs uppercase tracking-widest font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {booking.status}
                      </span>
                    </div>
                    
                    {/* Timeline visualization */}
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Ordered</span>
                      </div>
                      <div className="flex-1 h-px bg-border mx-2"></div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${booking.status === 'active' || booking.status === 'completed' ? 'bg-green-500' : 'bg-muted'}`}></div>
                        <span>Received</span>
                      </div>
                      <div className="flex-1 h-px bg-border mx-2"></div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${booking.status === 'completed' ? 'bg-green-500' : 'bg-muted'}`}></div>
                        <span>Returned</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                    <div className="font-semibold text-lg">₹{booking.totalAmount}</div>
                    {booking.status === 'active' && (
                      <button className="text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">
                        Initiate Return
                      </button>
                    )}
                    {booking.status === 'pending' && (
                      <Link href={`/checkout/confirm?order_id=${booking.order_id}`} className="text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                        Complete Payment
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "wishlist" && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl">Your Wishlist</h2>
          <div className="border border-border border-dashed rounded-xl p-12 text-center bg-secondary/30">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-ink">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">We are building your wishlist.</p>
          </div>
        </div>
      )}

      {activeTab === "measurements" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl">Smart Sizing Profile</h2>
            <span className="bg-gradient-to-r from-primary to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center">
              ✨ AI Match Enabled
            </span>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl">
            <p className="text-sm text-muted-foreground mb-6">Enter your measurements to get AI-powered fit predictions on all outfits.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Height (cm)</label>
                <input type="number" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="e.g. 175" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chest (cm)</label>
                <input type="number" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="e.g. 96" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Waist (cm)</label>
                <input type="number" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="e.g. 81" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hips (cm)</label>
                <input type="number" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" placeholder="e.g. 98" />
              </div>
            </div>
            <button className="mt-6 btn-primary w-full md:w-auto">Save Measurements</button>
          </div>
        </div>
      )}
    </div>
  );
}
