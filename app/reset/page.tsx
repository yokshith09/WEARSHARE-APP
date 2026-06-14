"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-background" />}>
      <ResetContent />
    </Suspense>
  );
}

function ResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/password/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send reset email");
      setSuccess(true);
      setMessage("Check your email for a password reset link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to reset password");
      setSuccess(true);
      setMessage("Password updated. You can sign in now.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  const hasResetLink = Boolean(token && initialEmail);

  return (
    <div className="bg-background">
      <section className="container-edit grid min-h-[72vh] place-items-center py-16">
        <div className="w-full max-w-md border border-border bg-card p-7 shadow-soft md:p-9">
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
          <p className="eyebrow mt-8">Account security</p>
          <h1 className="mt-3 font-display text-3xl text-ink">
            {hasResetLink ? "Choose a new password" : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {hasResetLink
              ? "Use at least 8 characters. Your reset link can only be used once."
              : "Enter your account email and we will send a secure reset link."}
          </p>

          <form onSubmit={hasResetLink ? resetPassword : requestReset} className="mt-7 space-y-4">
            <Field icon={Mail} label="Email address">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={hasResetLink}
                className="form-input pl-10 disabled:opacity-70"
                required
              />
            </Field>

            {hasResetLink && (
              <>
                <Field icon={KeyRound} label="New password">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    className="form-input pl-10"
                    required
                  />
                </Field>
                <Field icon={KeyRound} label="Confirm password">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    className="form-input pl-10"
                    required
                  />
                </Field>
              </>
            )}

            {message && (
              <p className={`text-sm ${success ? "text-primary" : "text-red-600"}`}>{message}</p>
            )}

            {success && hasResetLink ? (
              <Link href="/login" className="btn-primary w-full">Return to sign in</Link>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Please wait..." : hasResetLink ? "Update password" : "Send reset link"}
              </button>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        {children}
      </span>
    </label>
  );
}
