"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, TrendingUp, Inbox, AlertCircle, Plus, Edit2, Archive } from "lucide-react";
import dynamic from "next/dynamic";
const EarningsChart = dynamic(() => import("@/components/earnings-chart"), { ssr: false });

const earningsData = [
  { name: 'Jan', earnings: 0 },
  { name: 'Feb', earnings: 0 },
  { name: 'Mar', earnings: 0 },
  { name: 'Apr', earnings: 0 },
  { name: 'May', earnings: 4500 },
  { name: 'Jun', earnings: 12000 },
];

export default function ListerDashboard() {
  const [activeTab, setActiveTab] = useState<"inventory" | "earnings" | "requests">("inventory");
  const [data, setData] = useState({ lending: [] });
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<any>(null);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/bookings/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, deliveryStatus: newStatus }),
      });
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          lending: prev.lending.map((b: any) =>
            b.id === bookingId ? { ...b, status: newStatus } : b
          ),
        }));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const pendingRequests = (data?.lending || []).filter((b: any) => b.status === 'pending');
  const inventoryRentals = (data?.lending || []).filter((b: any) => b.status !== 'pending');

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((res) => res.json()),
      fetch("/api/listings?mine=1").then((res) => res.json()),
    ])
      .then(([resData, listingData]) => {
        setData(resData);
        setListings(Array.isArray(listingData) ? listingData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Lister Sub-Navigation */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "inventory" ? "bg-primary text-white" : "bg-secondary text-ink hover:bg-secondary/80"
          }`}
        >
          <Tag className="h-4 w-4 inline-block mr-2" />
          Inventory Manager
        </button>
        <button
          onClick={() => setActiveTab("earnings")}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "earnings" ? "bg-primary text-white" : "bg-secondary text-ink hover:bg-secondary/80"
          }`}
        >
          <TrendingUp className="h-4 w-4 inline-block mr-2" />
          Earnings & Payouts
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "requests" ? "bg-primary text-white" : "bg-secondary text-ink hover:bg-secondary/80"
          }`}
        >
          <Inbox className="h-4 w-4 inline-block mr-2" />
          Rental Requests
        </button>
      </div>

      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl">Inventory Management</h2>
            <Link href="/list-item" className="btn-primary flex items-center gap-2 h-10">
              <Plus className="h-4 w-4" /> Add Listing
            </Link>
          </div>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex gap-2">
              <select className="text-sm bg-secondary border-none rounded-md px-3 py-1.5 focus:ring-0">
                <option>All Statuses</option>
                <option>Active</option>
                <option>Rented</option>
                <option>Maintenance</option>
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Item</th>
                    <th className="px-6 py-4 font-medium">Price/Day</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Earnings</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Mock empty state if no listings, otherwise map over listings */}
                  {inventoryRentals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No items in inventory.
                      </td>
                    </tr>
                  ) : (
                    inventoryRentals.map((booking: any) => (
                      <tr key={booking.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={booking.listingImage || "/placeholder.jpg"} className="w-10 h-10 rounded-md object-cover bg-muted" />
                            <span className="font-medium text-ink">{booking.listingName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">₹{booking.rentalPrice}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'active' ? 'bg-green-100 text-green-700' : booking.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {booking.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">₹{booking.rentalPrice * booking.days}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setEditingBooking(booking)} className="text-muted-foreground hover:text-ink mr-3" title="Edit Rental">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="text-muted-foreground hover:text-red-500" title="Archive">
                            <Archive className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "earnings" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Earnings</h3>
              <p className="text-3xl font-display text-ink">₹16,500</p>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Pending Payouts</h3>
              <p className="text-3xl font-display text-primary">₹4,200</p>
              <button className="text-xs text-primary mt-2 hover:underline">View Details</button>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Razorpay Route Split</h3>
              <p className="text-sm text-ink mt-2">Platform Fee: <span className="font-semibold text-red-500">15%</span></p>
              <p className="text-sm text-ink">Your Cut: <span className="font-semibold text-green-500">85%</span></p>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl">
            <h3 className="font-display text-xl mb-6">Earnings Overview</h3>
            <div className="h-[300px] w-full">
              <EarningsChart data={earningsData} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl">Rental Requests</h2>
          {pendingRequests.length === 0 ? (
            <div className="border border-border border-dashed rounded-xl p-12 text-center bg-secondary/30">
              <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-ink">No requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">You have no pending rental requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((booking: any) => (
                <div key={booking.id} className="border border-border rounded-xl p-5 bg-card flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="h-16 w-16 bg-muted rounded-full overflow-hidden shrink-0">
                    <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {booking.renterId?.substring(0, 2) || "U"}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-ink text-lg">User requested {booking.listingName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Dates: {booking.rentalStart} to {booking.rentalEnd}</p>
                    <p className="text-xs text-primary mt-1 font-medium bg-primary/10 inline-block px-2 py-0.5 rounded">
                      Earn ₹{booking.rentalPrice * booking.days}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => handleStatusChange(booking.id, 'declined')} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-md text-sm transition-colors">
                      Decline
                    </button>
                    <button onClick={() => handleStatusChange(booking.id, 'active')} className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white hover:bg-primary/90 font-medium rounded-md text-sm transition-colors">
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-xl mb-4">Edit Active Rental</h3>
            <p className="text-sm mb-6 text-muted-foreground">Update the status for <strong>{editingBooking.listingName}</strong>.</p>
            <div className="space-y-3">
              <button onClick={() => handleStatusChange(editingBooking.id, 'completed').then(() => setEditingBooking(null))} className="w-full btn-primary py-3">Mark as Completed / Returned</button>
              <button onClick={() => handleStatusChange(editingBooking.id, 'maintenance').then(() => setEditingBooking(null))} className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 py-3 rounded-lg font-medium transition-colors">Send to Maintenance</button>
              <button onClick={() => setEditingBooking(null)} className="w-full btn-outline py-3 mt-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
