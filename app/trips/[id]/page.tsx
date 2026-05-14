"use client";
import Link from "next/link";
import { useRef, useState, useMemo } from "react";
import {
  ArrowLeft, MapPin, MessageCircle, Send, Camera, Check, Clock, Package, Truck, RotateCcw,
  ShieldCheck, Phone, Paperclip, Image as ImageIcon, AlertTriangle, X, Plus, Wallet,
} from "lucide-react";
import { getListing, inr } from "@/lib/listings";
import { useParams } from "next/navigation";

type Stage = "requested" | "approved" | "picked_up" | "returned";

const stages: { id: Stage; label: string; sub: string; icon: any }[] = [
  { id: "requested", label: "Requested", sub: "You sent the booking", icon: Clock },
  { id: "approved", label: "Approved", sub: "Lister confirmed", icon: Check },
  { id: "picked_up", label: "Picked up", sub: "Outfit handed over", icon: Package },
  { id: "returned", label: "Returned", sub: "Deposit released", icon: RotateCcw },
];

type Msg =
  | { id: string; from: "me" | "lister"; time: string; kind: "text"; text: string }
  | { id: string; from: "me" | "lister"; time: string; kind: "address"; title: string; address: string; window: string }
  | { id: string; from: "me" | "lister"; time: string; kind: "photos"; caption?: string; photos: string[] };

const PICKUP_CHECKLIST = [
  "Inspect garment together - note any pre-existing marks",
  "Take 4 photos: front, back, close-ups, accessories",
  "Confirm size and accessory count",
  "Both parties tap 'Confirm pickup' to start the rental clock",
];

const RETURN_CHECKLIST = [
  "Garment returned in same bag, dry-cleaned if specified",
  "Photograph the returned piece - front, back, any concerns",
  "Lister inspects within 24h to release the deposit",
  "Open a damage claim if anything's off - we'll mediate",
];

export default function TripPage() {
  const params = useParams();
  const id = params.id as string;
  const listing = useMemo(() => getListing(id), [id]);

  const [current, setCurrent] = useState<Stage>("approved");
  const [pickupConfirmedBy, setPickupConfirmedBy] = useState<{ me: boolean; lister: boolean }>({ me: false, lister: true });
  const [returnConfirmedBy, setReturnConfirmedBy] = useState<{ me: boolean; lister: boolean }>({ me: false, lister: false });
  const [pickupPhotos, setPickupPhotos] = useState<string[]>([]);
  const [returnPhotos, setReturnPhotos] = useState<string[]>([]);
  const [depositReleased, setDepositReleased] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([
    { id: "m1", from: "lister", kind: "text", time: "10:24 AM", text: `Hi! Booking confirmed. Pickup is at my place in ${listing?.area || ""} - anytime between 6-9pm Friday works.` },
    {
      id: "m2", from: "lister", kind: "address", time: "10:24 AM",
      title: "Pickup address", address: `2nd Floor, 12th Main, ${listing?.area || ""}, ${listing?.city || ""} 560038`, window: "Friday / 6:00 - 9:00 PM",
    },
    { id: "m3", from: "me", kind: "text", time: "10:31 AM", text: "Perfect, I'll come around 7pm. Should I bring an ID?" },
    { id: "m4", from: "lister", kind: "text", time: "10:33 AM", text: "Yes please, just for verification at handover. I'll have it steam-pressed and bagged." },
  ]);
  const [draft, setDraft] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const chatPhotoRef = useRef<HTMLInputElement>(null);

  if (!listing) return <div className="p-20 text-center">Not found</div>;

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { id: `m${m.length + 1}`, from: "me", kind: "text", time: "now", text: draft }]);
    setDraft("");
  };

  const shareAddressCard = (kind: "pickup" | "return") => {
    setMessages((m) => [
      ...m,
      {
        id: `m${m.length + 1}`,
        from: "me",
        kind: "address",
        time: "now",
        title: kind === "pickup" ? "Pickup address" : "Return address",
        address: `2nd Floor, 12th Main, ${listing.area}, ${listing.city} 560038`,
        window: kind === "pickup" ? "Friday / 6:00 - 9:00 PM" : "Sunday / 5:00 - 8:00 PM",
      },
    ]);
    setActionsOpen(false);
  };

  const sendChatPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const urls = Array.from(files).slice(0, 4).map((f) => URL.createObjectURL(f));
    setMessages((m) => [...m, { id: `m${m.length + 1}`, from: "me", kind: "photos", time: "now", photos: urls, caption: "Handover photos" }]);
    setActionsOpen(false);
  };

  const idx = stages.findIndex((s) => s.id === current);
  const bothPickupConfirmed = pickupConfirmedBy.me && pickupConfirmedBy.lister;
  const bothReturnConfirmed = returnConfirmedBy.me && returnConfirmedBy.lister;

  const onPickupConfirm = () => {
    setPickupConfirmedBy((p) => ({ ...p, me: true }));
    if (pickupConfirmedBy.lister) setCurrent("picked_up");
  };
  const onReturnConfirm = () => {
    setReturnConfirmedBy((r) => ({ ...r, me: true }));
    if (returnConfirmedBy.lister) setCurrent("returned");
  };
  const releaseDeposit = () => setDepositReleased(true);

  return (
    <div className="bg-background">
      <div className="container-edit pt-8">
        <Link href={`/listing/${listing.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to listing
        </Link>
      </div>

      <section className="container-edit pt-6 pb-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="eyebrow">Trip / #WS-{listing.id.slice(0, 6).toUpperCase()}</p>
            <h1 className="font-display text-4xl md:text-5xl mt-3 text-ink leading-tight">{listing.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">with {listing.lister} / {listing.area}, {listing.city}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow">Total paid</p>
            <p className="font-display text-2xl text-ink mt-1">{inr(listing.pricePerDay * 2 + Math.round(listing.pricePerDay * 0.13))}</p>
            <p className="text-[11px] text-muted-foreground">+ {inr(listing.deposit)} held as deposit</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-10 border border-border p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="eyebrow">Booking status</p>
            <Link
              href={`/claims/${listing.id}`}
              className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline"
            >
              <AlertTriangle className="h-3 w-3" /> Open damage claim
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2 relative">
            {stages.map((s, i) => {
              const done = i <= idx;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex flex-col items-center text-center relative">
                  {i > 0 && (
                    <div className={`absolute right-1/2 top-5 h-px w-full ${i <= idx ? "bg-primary" : "bg-border"}`} />
                  )}
                  <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center border ${done ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className={`mt-3 text-xs font-medium ${done ? "text-ink" : "text-muted-foreground"}`}>{s.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[12ch]">{s.sub}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            <TimelineStep
              active={current === "approved" || current === "picked_up" || current === "returned"}
              done={current === "picked_up" || current === "returned"}
              title="Pickup confirmation"
              subtitle="Both renter & lister confirm at handover."
            >
              <Checklist items={PICKUP_CHECKLIST} />
              <PhotoStrip
                photos={pickupPhotos}
                onAdd={(urls) => setPickupPhotos((p) => [...p, ...urls].slice(0, 6))}
                onRemove={(i) => setPickupPhotos((p) => p.filter((_, x) => x !== i))}
                emptyHint="Add 4 handover photos before confirming."
              />
              <DualConfirm
                meDone={pickupConfirmedBy.me}
                listerDone={pickupConfirmedBy.lister}
                onMe={onPickupConfirm}
                meLabel="Confirm pickup"
                disabled={pickupPhotos.length < 1 || current === "returned"}
              />
              {bothPickupConfirmed && current !== "returned" && (
                <p className="text-[11px] text-primary mt-2 inline-flex items-center gap-1">
                  <Check className="h-3 w-3" /> Rental clock started - return by Sunday 8 PM.
                </p>
              )}
            </TimelineStep>

            <TimelineStep
              active={current === "picked_up" || current === "returned"}
              done={current === "returned"}
              title="Return confirmation"
              subtitle="Lister inspects, then your deposit is released."
            >
              <Checklist items={RETURN_CHECKLIST} />
              <PhotoStrip
                photos={returnPhotos}
                onAdd={(urls) => setReturnPhotos((p) => [...p, ...urls].slice(0, 6))}
                onRemove={(i) => setReturnPhotos((p) => p.filter((_, x) => x !== i))}
                emptyHint="Optional - photograph the returned outfit."
              />
              <DualConfirm
                meDone={returnConfirmedBy.me}
                listerDone={returnConfirmedBy.lister}
                onMe={onReturnConfirm}
                meLabel="Confirm return"
                disabled={!bothPickupConfirmed}
              />
              <div className={`mt-4 border ${bothReturnConfirmed ? "border-primary bg-primary/5" : "border-border bg-secondary/30"} p-4 flex items-start gap-3`}>
                <Wallet className={`h-5 w-5 shrink-0 mt-0.5 ${bothReturnConfirmed ? "text-primary" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <p className="text-sm text-ink font-medium">Deposit / {inr(listing.deposit)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {depositReleased
                      ? "Released to your account. Will reflect in 2-3 working days."
                      : bothReturnConfirmed
                      ? "Both parties confirmed. Ready to release the deposit."
                      : "Locked until return is confirmed by both parties."}
                  </p>
                </div>
                <button
                  onClick={releaseDeposit}
                  disabled={!bothReturnConfirmed || depositReleased}
                  className="text-xs border border-ink text-ink px-3 py-1.5 hover:bg-ink hover:text-cream transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {depositReleased ? "Released" : "Release deposit"}
                </button>
              </div>
            </TimelineStep>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-6">
            <div className="border border-border">
              <div className="px-5 py-4 bg-secondary/40 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-sm text-ink font-medium">Pickup address</p>
              </div>
              <div className="p-5 text-sm">
                <p className="text-ink">2nd Floor, 12th Main, {listing.area}</p>
                <p className="text-ink">{listing.city} - 560038</p>
                <p className="text-xs text-muted-foreground mt-3">Friday / 6:00 - 9:00 PM</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-xs border border-ink text-ink px-3 py-1.5 hover:bg-ink hover:text-cream transition">Open in maps</a>
                  <button className="text-xs border border-border text-ink px-3 py-1.5 hover:bg-secondary inline-flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> Call lister
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 border border-border flex flex-col h-[640px]">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-clay flex items-center justify-center font-display text-ink">
                {listing.lister.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-ink font-medium flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" /> {listing.lister}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => (
                <ChatBubble key={m.id} msg={m} />
              ))}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Message your lister..."
                className="form-input flex-1"
              />
              <button onClick={send} className="bg-ink text-cream px-4 hover:bg-primary transition">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Msg }) {
  const mine = msg.from === "me";
  if (msg.kind === "text") {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[75%] px-4 py-2.5 text-sm ${mine ? "bg-ink text-cream" : "bg-secondary text-ink"}`}>
          <p>{msg.text}</p>
          <p className={`text-[10px] mt-1 ${mine ? "text-cream/60" : "text-muted-foreground"}`}>{msg.time}</p>
        </div>
      </div>
    );
  }
  if (msg.kind === "address") {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[80%] border ${mine ? "border-ink bg-ink text-cream" : "border-border bg-background"} overflow-hidden`}>
          <div className="p-3 text-sm">
            <p className={mine ? "text-cream" : "text-ink"}>{msg.address}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${mine ? "bg-ink text-cream" : "bg-secondary text-ink"} p-2`}>
        <div className="grid grid-cols-2 gap-1">
          {msg.photos.map((p, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-black/10">
              <img src={p} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineStep({
  active, done, title, subtitle, children,
}: { active: boolean; done: boolean; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className={`border ${done ? "border-primary/40 bg-primary/[0.03]" : active ? "border-border" : "border-border opacity-60"}`}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <div>
          <p className="text-sm text-ink font-medium">{title}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="text-sm space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-muted-foreground">
          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function PhotoStrip({
  photos, onAdd, onRemove, emptyHint,
}: { photos: string[]; onAdd: (urls: string[]) => void; onRemove: (i: number) => void; emptyHint: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {photos.map((p, i) => (
          <div key={i} className="relative h-16 w-16 overflow-hidden bg-muted group">
            <img src={p} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-0.5 right-0.5 h-5 w-5 bg-cream/90 text-ink rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="h-16 w-16 border border-dashed border-border flex flex-col items-center justify-center"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (!e.target.files) return;
          onAdd(Array.from(e.target.files).map((f) => URL.createObjectURL(f)));
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

function DualConfirm({
  meDone, listerDone, onMe, meLabel, disabled,
}: { meDone: boolean; listerDone: boolean; onMe: () => void; meLabel: string; disabled?: boolean }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <button
        onClick={onMe}
        disabled={disabled || meDone}
        className={`text-sm py-2.5 border transition ${
          meDone ? "border-primary bg-primary text-primary-foreground" : "border-ink text-ink"
        }`}
      >
        {meDone ? "Confirmed" : meLabel}
      </button>
    </div>
  );
}
