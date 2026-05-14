"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, FileText, ImagePlus, ShieldCheck, Upload, X } from "lucide-react";
import { getListing, inr } from "@/lib/listings";
import { useParams } from "next/navigation";

const issueTypes = ["Stain", "Tear", "Missing accessory", "Late return", "Cleaning issue"];

export default function ClaimPage() {
  const params = useParams();
  const id = params.id as string;
  const listing = useMemo(() => getListing(id), [id]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [issue, setIssue] = useState(issueTypes[0]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!listing) {
    return (
      <div className="container-edit py-32 text-center">
        <p className="font-display text-3xl">Outfit not found</p>
        <Link href="/browse" className="mt-6 inline-block text-primary underline">Back to browse</Link>
      </div>
    );
  }

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 6 - photos.length)
      .map((file) => URL.createObjectURL(file));
    setPhotos((current) => [...current, ...urls].slice(0, 6));
  };

  if (submitted) {
    return (
      <div className="bg-background">
        <section className="container-edit grid min-h-[68vh] place-items-center py-20">
          <div className="panel max-w-xl p-8 text-center md:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Check className="h-6 w-6" />
            </div>
            <p className="eyebrow mt-6">Claim opened</p>
            <h1 className="mt-3 font-display text-4xl text-ink">We'll review this within 48 hours.</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Your deposit stays locked while both sides upload evidence. A moderator will compare handover photos,
              return photos, and chat history before any deduction is made.
            </p>
            <Link href={`/trips/${listing.id}`} className="btn-primary mt-8">Back to trip</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container-edit pt-8">
        <Link href={`/trips/${listing.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to trip
        </Link>
      </div>

      <section className="container-edit grid gap-10 pt-6 pb-20 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-5">
          <p className="eyebrow flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Damage protection</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">Open a claim with clear evidence.</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Claims work best when the issue is specific, photographed, and tied to the pickup or return checklist.
            Minor wear is covered by protection; major damage may use part of the refundable deposit.
          </p>

          <div className="panel mt-8 overflow-hidden">
            <div className="flex gap-4 border-b border-border p-5">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                <img src={listing.image} alt={listing.title} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="eyebrow">{listing.occasion}</p>
                <p className="mt-1 font-display text-xl leading-tight text-ink">{listing.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Deposit held: {inr(listing.deposit)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border text-center text-xs">
              <div className="p-4">
                <p className="eyebrow">Evidence</p>
                <p className="mt-1 text-ink">Photos</p>
              </div>
              <div className="p-4">
                <p className="eyebrow">SLA</p>
                <p className="mt-1 text-ink">48h</p>
              </div>
              <div className="p-4">
                <p className="eyebrow">Status</p>
                <p className="mt-1 text-primary">Protected</p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}
          className="panel space-y-8 p-6 md:col-span-7 md:p-8"
        >
          <div>
            <p className="eyebrow">Issue type</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {issueTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIssue(type)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
                    issue === type ? "border-primary bg-primary text-primary-foreground" : "border-border text-ink hover:border-ink"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow">Upload photos</p>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {photos.map((photo, index) => (
                <div key={photo} className="group relative aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={photo} alt={`Claim evidence ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-card text-ink opacity-0 shadow-sm transition group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square rounded-md border border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <span className="flex h-full flex-col items-center justify-center gap-1">
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px] uppercase">Add</span>
                  </span>
                </button>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => addPhotos(event.target.files)} />
          </div>

          <label className="block">
            <span className="eyebrow">What happened?</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="form-input mt-3 min-h-36 resize-none"
              placeholder="Describe the condition at pickup or return, where the issue appears, and anything already discussed in chat."
              required
            />
          </label>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            {[
              { icon: Camera, title: "Photo compare", text: "Moderator reviews pickup and return photos." },
              { icon: FileText, title: "Chat context", text: "Messages and checklist actions stay attached." },
              { icon: Upload, title: "Evidence first", text: "No deposit action without shared evidence." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-md border border-border p-4">
                <Icon className="h-4 w-4 text-primary" />
                <p className="mt-3 font-medium text-ink">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">Submit only when you have checked the item with the other party.</p>
            <button type="submit" disabled={photos.length === 0 || !notes.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
              Open claim
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
