"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BadgeCheck, LayoutDashboard, LogOut, Ruler, Save, ShoppingBag, User } from "lucide-react";

const measurementFields = [
  ["height", "Height (cm)"],
  ["chest", "Chest (cm)"],
  ["waist", "Waist (cm)"],
  ["hips", "Hips (cm)"],
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { status } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/profile");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/profile")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login?callbackUrl=/profile");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) setProfile(data);
      });
  }, [router, status]);

  const updateProfile = (key: string, value: string) => {
    setProfile((current: any) => ({ ...current, [key]: value }));
  };

  const updateMeasurement = (key: string, value: string) => {
    setProfile((current: any) => ({
      ...current,
      measurements: {
        ...(current?.measurements || {}),
        [key]: value,
      },
    }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save profile");
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !profile) {
    return <div className="container-edit py-32 text-center text-muted-foreground">Loading your profile...</div>;
  }

  return (
    <div className="bg-background">
      <section className="container-edit py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Your account</p>
            <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">Profile</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/renter" className="btn-outline">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="btn-outline">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-white">
                  {profile.image ? <img src={profile.image} alt="" className="h-full w-full rounded-full object-cover" /> : profile.name?.charAt(0) || <User />}
                </div>
                <div>
                  <p className="font-display text-2xl text-ink">{profile.name || "WearShare user"}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">Verification</span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    <BadgeCheck className="h-4 w-4" /> {profile.isVerified ? "Verified" : "Basic"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="text-ink">{Number(profile.rating || 4.5).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </aside>

          <form onSubmit={saveProfile} className="space-y-8 lg:col-span-8">
            <div className="border border-border bg-card p-6">
              <h2 className="font-display text-2xl text-ink">Contact details</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Name">
                  <input className="form-input" value={profile.name || ""} onChange={(event) => updateProfile("name", event.target.value)} />
                </Field>
                <Field label="Email">
                  <input className="form-input" type="email" value={profile.email || ""} onChange={(event) => updateProfile("email", event.target.value)} />
                </Field>
                <Field label="Pickup address">
                  <input className="form-input" value={profile.address || ""} onChange={(event) => updateProfile("address", event.target.value)} />
                </Field>
              </div>
            </div>

            <div className="border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
                <Ruler className="h-5 w-5 text-primary" /> Fit profile
              </h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {measurementFields.map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input
                      className="form-input"
                      inputMode="numeric"
                      value={profile.measurements?.[key] || ""}
                      onChange={(event) => updateMeasurement(key, event.target.value)}
                    />
                  </Field>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save profile"}
              </button>
              <Link href="/browse" className="btn-outline">
                <ShoppingBag className="h-4 w-4" /> Browse outfits
              </Link>
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
