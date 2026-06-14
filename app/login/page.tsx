"use client";

import { Suspense, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail, MessageSquare } from "lucide-react";
import heroImg from "@/assets/hero-lehenga.jpg";

type AuthMethod = "password" | "email-otp";
type PasswordMode = "login" | "register";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("callback") || "/dashboard/renter";
  const initialError = useMemo(() => {
    const code = searchParams.get("error");
    if (!code) return "";
    if (code === "OAuthCallback" || code === "Callback") {
      return "Google sign-in could not finish. Please check the Google redirect URI setup, or continue with email.";
    }
    if (code === "OAuthSignin") {
      return "Google sign-in is not configured yet. Continue with email for now.";
    }
    return `Sign-in failed: ${code}`;
  }, [searchParams]);

  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const normalizedEmail = email.trim().toLowerCase();

  const handlePasswordAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizedEmail || password.length < 8) {
      setError("Enter an email and a password with at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await signIn("email-password", {
      email: normalizedEmail,
      password,
      mode: passwordMode,
      callbackUrl,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError(passwordMode === "register"
        ? "Could not create this account. It may already exist."
        : "Invalid email or password.");
      return;
    }

    window.location.href = result?.url || callbackUrl;
  };

  const handleSendEmailOtp = async (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    if (!normalizedEmail) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send OTP");
      setEmail(normalizedEmail);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError("");
    const result = await signIn("email-otp", {
      email: normalizedEmail,
      otp,
      callbackUrl,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError("Invalid or expired OTP. Please request a fresh code.");
      return;
    }

    window.location.href = result?.url || callbackUrl;
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="container-edit relative z-10 grid max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl lg:grid-cols-2">
        <div className="relative hidden bg-muted lg:block">
          <img src={heroImg.src} alt="Fashion rental" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-12 text-white">
            <h2 className="mb-3 font-display text-4xl">WearShare</h2>
            <p className="text-sm text-white/80">Rent premium outfits, list your wardrobe, and keep every booking protected.</p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12 md:p-16">
          <div className="mx-auto w-full max-w-sm space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-3xl text-ink sm:text-4xl">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sign in to list items, manage rentals, and rent outfits.</p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-secondary py-3.5 text-sm font-medium text-ink transition-colors hover:bg-secondary/80"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>

            {error && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
              <button
                type="button"
                onClick={() => setAuthMethod("password")}
                className={`rounded-lg py-2 text-xs font-medium transition-colors ${authMethod === "password" ? "bg-background text-ink shadow-sm" : "text-muted-foreground"}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("email-otp")}
                className={`rounded-lg py-2 text-xs font-medium transition-colors ${authMethod === "email-otp" ? "bg-background text-ink shadow-sm" : "text-muted-foreground"}`}
              >
                Email OTP
              </button>
            </div>

            {authMethod === "password" ? (
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordMode("login")}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${passwordMode === "login" ? "border-ink bg-ink text-cream" : "border-border text-ink"}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordMode("register")}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${passwordMode === "register" ? "border-ink bg-ink text-cream" : "border-border text-ink"}`}
                  >
                    Create account
                  </button>
                </div>
                <Field icon={Mail} label="Email address">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </Field>
                <Field icon={KeyRound} label="Password">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    minLength={8}
                    required
                  />
                </Field>
                {passwordMode === "login" && (
                  <div className="text-right">
                    <Link href="/reset" className="text-xs text-primary hover:underline">Forgot password?</Link>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !email || password.length < 8}
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-sm font-medium"
                >
                  {loading ? "Please wait..." : passwordMode === "register" ? "Create account" : "Sign in"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            ) : otpSent ? (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <Field icon={MessageSquare} label="Enter OTP">
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit OTP"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm tracking-widest outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </Field>
                <p className="text-xs text-muted-foreground">
                  Sent to {normalizedEmail}.{" "}
                  <button type="button" onClick={() => setOtpSent(false)} className="text-primary hover:underline">Change</button>
                  {" / "}
                  <button type="button" onClick={handleSendEmailOtp} disabled={loading} className="text-primary hover:underline disabled:opacity-60">
                    Resend OTP
                  </button>
                </p>
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5 text-sm font-medium">
                  {loading ? "Verifying..." : "Sign in"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <Field icon={Mail} label="Email address">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </Field>
                <button type="submit" disabled={loading || !email} className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-sm font-medium">
                  {loading ? "Sending OTP..." : "Get email OTP"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        {children}
      </span>
    </label>
  );
}
