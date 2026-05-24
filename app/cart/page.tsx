"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, ArrowRight } from "lucide-react";

export default function CartPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const removeItem = async (listingId: string) => {
    setItems(items.filter(i => i.listingId !== listingId));
    await fetch(`/api/cart?listingId=${listingId}`, { method: 'DELETE' });
  };

  const subtotal = items.reduce((acc, item) => acc + (item.rentalPricePerDay * item.days), 0);
  const protectionFee = Math.round(subtotal * 0.05);
  const deposit = items.reduce((acc, item) => acc + (item.securityDeposit || 0), 0);
  const total = subtotal + protectionFee + deposit;

  if (loading) {
    return <div className="container-edit py-32 text-center text-muted-foreground">Loading cart...</div>;
  }

  return (
    <div className="bg-background min-h-screen pt-12 pb-24">
      <div className="container-edit max-w-4xl">
        <h1 className="font-display text-4xl text-ink mb-10">Your Cart</h1>
        
        {items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl bg-secondary/20">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-display text-2xl text-ink">Your cart is empty</p>
            <Link href="/browse" className="mt-6 inline-block btn-primary px-8">
              Browse Outfits
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-6">
              {items.map((item) => (
                <div key={item.listingId} className="flex gap-4 p-4 border border-border rounded-xl bg-card shadow-sm">
                  <div className="flex-1">
                    <p className="eyebrow">{item.category || 'Outfit'}</p>
                    <Link href={`/listing/${item.listingId}`} className="font-display text-xl text-ink hover:text-primary transition-colors block mt-1">
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-2">Size: {item.size} • By {item.ownerName || "WearShare lister"}</p>
                    {item.rentalStart && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.rentalStart} to {item.rentalEnd || "return date pending"}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <p className="font-semibold text-ink">₹{item.rentalPricePerDay?.toLocaleString("en-IN")}/day</p>
                      <p className="text-muted-foreground">{item.days} days</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <button onClick={() => removeItem(item.listingId)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <p className="font-display text-lg text-ink">₹{(item.rentalPricePerDay * item.days).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="md:col-span-1">
              <div className="border border-border rounded-xl p-6 bg-secondary/20 sticky top-24">
                <h3 className="font-display text-2xl text-ink mb-6">Order Summary</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Protection Fee</span>
                    <span>₹{protectionFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Refundable Deposit</span>
                    <span>₹{deposit.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between font-bold text-ink text-lg">
                    <span>Total Rent</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                
                <Link href="/checkout" className="mt-8 w-full btn-primary flex items-center justify-center gap-2 py-3.5">
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Deposit is refundable upon return.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
