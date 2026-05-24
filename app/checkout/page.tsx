"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ArrowLeft, ShieldCheck, CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function CheckoutPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login?callback=/checkout");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setItems(data.items || []);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  const subtotal = items.reduce((acc, item) => acc + (item.rentalPricePerDay * item.days), 0);
  const protectionFee = Math.round(subtotal * 0.05);
  const deposit = items.reduce((acc, item) => acc + (item.securityDeposit || 0), 0);
  const total = subtotal + protectionFee + deposit;

  const handlePayment = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    trackEvent("booking_started", {
      items: items.length,
      subtotal,
      deposit,
      total,
    });
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalStart: new Date().toISOString() }),
      });

      const orderData = await res.json();

      if (orderData.error) {
        alert(orderData.error);
        setProcessing(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "WearShare",
        description: "Clothing Rental",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const confirmRes = await fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              rentalStart: orderData.rentalStart,
            }),
          });

          const confirmData = await confirmRes.json();
          if (confirmData.success) {
            trackEvent("booking_completed", {
              bookings: confirmData.bookings,
              amount: total,
            });
            router.push("/dashboard/renter?checkout=success");
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#9333EA",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="container-edit py-32 text-center text-muted-foreground">Loading checkout...</div>;
  }

  return (
    <div className="bg-background min-h-screen pt-12 pb-24">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="container-edit max-w-4xl">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>
        
        <h1 className="font-display text-4xl text-ink mb-10">Secure Checkout</h1>
        
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-7 space-y-8">
            <div className="bg-secondary/20 border border-border p-6 rounded-xl">
              <h2 className="font-display text-2xl text-ink mb-4 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                WearShare Protection
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your rental is protected. We hold the security deposit in escrow and only release it 24h after the lister confirms the return. Minor wear and tear is covered by your protection fee.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-xl text-ink">Payment Method</h2>
              <div className="p-4 border border-primary bg-primary/5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-ink">Razorpay Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">UPI, Cards, Net Banking</p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="md:col-span-5">
            <div className="border border-border rounded-xl p-6 bg-card shadow-sm sticky top-24">
              <h3 className="font-display text-2xl text-ink mb-6">Order Summary</h3>
              <div className="space-y-4 text-sm mb-6 pb-6 border-b border-border">
                {items.map((item) => (
                  <div key={item.listingId} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Size {item.size} • {item.days} days</p>
                    </div>
                    <p className="font-medium text-ink">₹{(item.rentalPricePerDay * item.days).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Rent Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Protection Fee (5%)</span>
                  <span>₹{protectionFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Refundable Deposit</span>
                  <span>₹{deposit.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between font-bold text-ink text-xl">
                  <span>Total Amount</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              
              <button 
                onClick={handlePayment}
                disabled={processing || items.length === 0}
                className="mt-8 w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg font-medium shadow-lg hover:shadow-primary/20 disabled:opacity-70"
              >
                {processing ? "Processing..." : `Pay ₹${total.toLocaleString("en-IN")}`}
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground uppercase tracking-widest">
                <Lock className="h-3 w-3" /> 256-bit Secure Encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
