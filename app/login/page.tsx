"use client";

import { Suspense, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail, MessageSquare, User } from "lucide-react";

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
    return `Sign-in failed: ${code}`;
  }, [searchParams]);

  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [successMsg, setSuccessMsg] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  const handlePasswordAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizedEmail || password.length < 8) {
      setError("Please enter a valid email and a password with at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (passwordMode === "register") {
        // Direct registration endpoint for rich, accurate error feedback
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            password,
          }),
        });

        const regData = await regRes.json().catch(() => ({}));

        if (!regRes.ok || regData.error) {
          setError(regData.error || "Could not create your account. Please try again.");
          setLoading(false);
          return;
        }

        setSuccessMsg("Account created! Signing you in...");
      }

      // Sign in with credentials
      const result = await signIn("email-password", {
        email: normalizedEmail,
        password,
        name: name.trim() || normalizedEmail.split("@")[0],
        mode: "login",
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError(
          passwordMode === "register"
            ? "Account was created, but automatic sign-in failed. Please click 'Sign in' below."
            : "Invalid email or password. If you haven't created an account yet, click 'Create account'."
        );
        setLoading(false);
        return;
      }

      window.location.href = result?.url || callbackUrl;
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="container-edit relative z-10 grid max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl lg:grid-cols-2">
        <div className="relative hidden bg-muted lg:block">
          <img src="/assets/hero-lehenga.jpg" alt="Fashion rental" className="h-full w-full object-cover" />
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

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium">{error}</p>
                {passwordMode === "register" && error.includes("already exists") && (
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("login");
                      setError("");
                    }}
                    className="mt-2 text-xs font-semibold text-primary underline"
                  >
                    Switch to Sign in
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("password");
                  setError("");
                }}
                className={`rounded-lg py-2 text-xs font-medium transition-colors ${authMethod === "password" ? "bg-background text-ink shadow-sm" : "text-muted-foreground"}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("email-otp");
                  setError("");
                }}
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
                    onClick={() => {
                      setPasswordMode("login");
                      setError("");
                    }}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${passwordMode === "login" ? "border-ink bg-ink text-cream" : "border-border text-ink"}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("register");
                      setError("");
                    }}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${passwordMode === "register" ? "border-ink bg-ink text-cream" : "border-border text-ink"}`}
                  >
                    Create account
                  </button>
                </div>

                {passwordMode === "register" && (
                  <Field icon={User} label="Your name">
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </Field>
                )}

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
