"use client";

import { useEffect, useState } from "react";
import { Sparkles, Check, AlertCircle, Ruler, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SmartFitProps {
  garmentSize?: string;
  garmentCategory?: string;
}

const SIZE_CHART: Record<string, { chest: number; waist: number; hips: number }> = {
  XS: { chest: 81, waist: 66, hips: 91 },
  S: { chest: 86, waist: 71, hips: 96 },
  M: { chest: 91, waist: 76, hips: 101 },
  L: { chest: 96, waist: 81, hips: 106 },
  XL: { chest: 102, waist: 86, hips: 112 },
  Free: { chest: 90, waist: 75, hips: 100 },
};

export function SmartFitRecommender({ garmentSize = "M", garmentCategory = "Outfit" }: SmartFitProps) {
  const [profileMeasurements, setProfileMeasurements] = useState<{
    height?: string;
    chest?: string;
    waist?: string;
    hips?: string;
  } | null>(null);

  const [customChest, setCustomChest] = useState("");
  const [customWaist, setCustomWaist] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.measurements) {
          setProfileMeasurements(data.measurements);
          if (data.measurements.chest) setCustomChest(data.measurements.chest);
          if (data.measurements.waist) setCustomWaist(data.measurements.waist);
        }
      })
      .catch(() => {});
  }, []);

  const sizeKey = (garmentSize || "M").toUpperCase();
  const target = SIZE_CHART[sizeKey] || SIZE_CHART["M"];

  // Compute fit score
  const chestVal = Number(customChest || profileMeasurements?.chest || 0);
  const waistVal = Number(customWaist || profileMeasurements?.waist || 0);

  let fitScore = 95;
  let fitLabel = "Excellent Match";
  let fitNote = "Should fit true to size with standard drape.";

  if (sizeKey === "FREE") {
    fitScore = 99;
    fitLabel = "Universal Fit";
    fitNote = "Drapes naturally with adjustable drawstring/pleating.";
  } else if (chestVal > 0 || waistVal > 0) {
    let diffSum = 0;
    let count = 0;
    if (chestVal > 0) {
      diffSum += Math.abs(chestVal - target.chest);
      count++;
    }
    if (waistVal > 0) {
      diffSum += Math.abs(waistVal - target.waist);
      count++;
    }
    const avgDiff = count > 0 ? diffSum / count : 0;
    if (avgDiff <= 3) {
      fitScore = 98;
      fitLabel = "Perfect Fit";
      fitNote = "Matches your body measurements within 2-3 cm.";
    } else if (avgDiff <= 7) {
      fitScore = 92;
      fitLabel = "Great Fit";
      fitNote = "Comfortable fit with room for celebration movement.";
    } else if (avgDiff <= 12) {
      fitScore = 84;
      fitLabel = "Tailorable Fit";
      fitNote = "Slightly relaxed; inner seam allowance permits easy temporary tucking.";
    } else {
      fitScore = 74;
      fitLabel = "Check Sizing";
      fitNote = "Consider reviewing dimensions or contacting the lister.";
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-ink">Smart Fit: {fitLabel}</span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                {fitScore}% Match
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{fitNote}</p>
          </div>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
            >
              <Ruler className="h-3.5 w-3.5" />
              <span>{chestVal || waistVal ? "Adjust" : "Check Your Fit"}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="font-display text-sm font-semibold text-ink">Body Measurements</p>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Garment: {garmentSize}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your measurements in cm to instantly simulate drape & ease.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Chest / Bust (cm)</label>
                  <input
                    type="number"
                    value={customChest}
                    onChange={(e) => setCustomChest(e.target.value)}
                    placeholder="e.g. 91"
                    className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Waist (cm)</label>
                  <input
                    type="number"
                    value={customWaist}
                    onChange={(e) => setCustomWaist(e.target.value)}
                    placeholder="e.g. 76"
                    className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Designer {garmentCategory} tailored with standard 2-inch margins.</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-primary w-full text-xs py-2"
              >
                Apply & View Fit
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
