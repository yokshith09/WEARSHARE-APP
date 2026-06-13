"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Mail, Phone, MessageSquare } from "lucide-react";
import heroImg from "@/assets/hero-lehenga.jpg"; // Reusing an image for the background/side

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [method, setMethod] = useState<"phone" | "email">("email");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("error") ? `Sign-in failed: ${searchParams.get("error")}` : "");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "phone" && !phone) return;
    if (method === "email" && !email) return;
    setLoading(true);
    setError("");
    const normalizedPhone = phone.replace(/\s/g, "").startsWith("+91")
      ? phone.replace(/\s/g, "")
      : `+91${phone.replace(/\D/g, "").slice(-10)}`;

    fetch(method === "phone" ? "/api/auth/send-otp" : "/api/email/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(method === "phone" ? { phone: normalizedPhone } : { email }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to send OTP");
        if (method === "phone") setPhone(normalizedPhone);
        if (method === "email") setEmail(email.trim().toLowerCase());
        setStep("otp");
      })
      .catch((err) => {
        setError(err.message || "Unable to send OTP");
      })
      .finally(() => {
      setLoading(false);
      });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError("");
    const result = await signIn(method === "phone" ? "msg91-otp" : "email-otp", {
      phone,
      email,
      otp,
      callbackUrl: "/dashboard/renter",
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid or expired OTP. Please request a fresh code.");
      return;
    }
    window.location.href = result?.url || "/dashboard/renter";
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard/renter" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container-edit grid lg:grid-cols-2 bg-card border border-border shadow-2xl rounded-3xl overflow-hidden max-w-5xl z-10 relative">
        
        {/* Left side Image (Hidden on mobile) */}
        <div className="hidden lg:block relative bg-muted">
          <img src={heroImg.src} alt="Fashion" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12 text-white">
            <h2 className="font-display text-4xl mb-3">WearShare</h2>
            <p className="text-white/80 text-sm">Rent premium designer outfits at a fraction of the cost. Join the community of smart fashion lovers.</p>
          </div>
        </div>

        {/* Right side Form */}
        <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto space-y-8">
            
            <div className="text-center lg:text-left">
              <h1 className="font-display text-3xl sm:text-4xl text-ink">Welcome back</h1>
              <p className="text-muted-foreground mt-2 text-sm">Sign in to list items, manage rentals, and rent outfits.</p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-secondary text-ink hover:bg-secondary/80 py-3.5 rounded-xl text-sm font-medium transition-colors border border-border"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            {error && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
                  <button
                    type="button"
                    onClick={() => setMethod("email")}
                    className={`rounded-lg py-2 text-xs font-medium transition-colors ${method === "email" ? "bg-background text-ink shadow-sm" : "text-muted-foreground"}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("phone")}
                    className={`rounded-lg py-2 text-xs font-medium transition-colors ${method === "phone" ? "bg-background text-ink shadow-sm" : "text-muted-foreground"}`}
                  >
                    Phone
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {method === "email" ? "Email address" : "Phone Number"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      {method === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                    </div>
                    {method === "email" ? (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        required
                      />
                    ) : (
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 99999 99999"
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        required
                      />
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || (method === "phone" ? !phone : !email)}
                  className="w-full btn-primary py-3.5 text-sm font-medium flex justify-center items-center gap-2"
                >
                  {loading ? "Sending OTP..." : "Get OTP"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Enter OTP</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm tracking-widest focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sent to {method === "phone" ? phone : email}. <button type="button" onClick={() => setStep("phone")} className="text-primary hover:underline">Change</button>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !otp}
                  className="w-full btn-primary py-3.5 text-sm font-medium"
                >
                  {loading ? "Verifying..." : "Sign In"}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
