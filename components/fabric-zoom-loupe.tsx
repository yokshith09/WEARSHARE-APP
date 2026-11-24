"use client";

import { useRef, useState, MouseEvent, TouchEvent } from "react";
import { ZoomIn, Eye, Sparkles, SlidersHorizontal } from "lucide-react";

interface FabricZoomLoupeProps {
  src: string;
  alt: string;
  className?: string;
  defaultZoom?: number;
}

export function FabricZoomLoupe({
  src,
  alt,
  className = "",
  defaultZoom = 2.5,
}: FabricZoomLoupeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [loupeActive, setLoupeActive] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(defaultZoom);

  const LENS_SIZE = 150;

  const updateCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current || !loupeActive) return;
    const rect = containerRef.current.getBoundingClientRect();

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Constrain lens center within image bounds
    const boundedX = Math.max(0, Math.min(mouseX, rect.width));
    const boundedY = Math.max(0, Math.min(mouseY, rect.height));

    setLensPos({
      x: boundedX - LENS_SIZE / 2,
      y: boundedY - LENS_SIZE / 2,
    });

    // Background percentage for magnified view
    const percentX = (boundedX / rect.width) * 100;
    const percentY = (boundedY / rect.height) * 100;

    setBgPos({ x: percentX, y: percentY });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    updateCoordinates(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) {
      setIsHovered(true);
      updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const toggleZoom = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoupeActive((prev) => !prev);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Container - Static & stable, no 3D tilt */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        onTouchMove={handleTouchMove}
        className={`relative aspect-[4/5] lg:aspect-[5/6] max-h-[720px] overflow-hidden rounded-2xl bg-muted shadow-xl border border-border/80 select-none ${
          loupeActive ? "cursor-crosshair" : "cursor-default"
        }`}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="h-full w-full object-cover object-top select-none pointer-events-none"
        />

        {/* Loupe Lens - Clean Circular Optical Magnifier */}
        {isHovered && loupeActive && (
          <div
            style={{
              width: `${LENS_SIZE}px`,
              height: `${LENS_SIZE}px`,
              transform: `translate3d(${lensPos.x}px, ${lensPos.y}px, 0)`,
              backgroundImage: `url(${src})`,
              backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
              backgroundSize: `${zoomLevel * 100}%`,
              backgroundRepeat: "no-repeat",
              pointerEvents: "none",
            }}
            className="absolute left-0 top-0 z-30 rounded-full border-2 border-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.55),_inset_0_0_0_1px_rgba(255,255,255,0.4)] ring-1 ring-black/30 backdrop-blur-[1px]"
          >
            {/* Precision Optical Center Reticle */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <div className="h-5 w-[1.5px] bg-white drop-shadow-sm" />
              <div className="h-[1.5px] w-5 bg-white drop-shadow-sm" />
            </div>

            {/* Subtle Glass Arc Sheen */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/40 pointer-events-none" />

            {/* Magnification pill badge floating above lens */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white tracking-wider shadow-sm pointer-events-none">
              {zoomLevel.toFixed(1)}x
            </div>
          </div>
        )}

        {/* Quick Overlay Action Pill (Top Right) */}
        <button
          type="button"
          onClick={toggleZoom}
          className={`absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer ${
            loupeActive
              ? "bg-ink/80 text-background hover:bg-ink"
              : "bg-background/90 text-foreground border border-border hover:bg-background"
          }`}
          aria-label={loupeActive ? "Disable fabric zoom" : "Enable fabric zoom"}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full transition-colors ${
              loupeActive ? "bg-emerald-400 animate-pulse" : "bg-neutral-400"
            }`}
          />
          <ZoomIn className="h-3 w-3" />
          <span>{loupeActive ? "Zoom On" : "Zoom Off"}</span>
        </button>

        {/* Subtle Status Hint (Bottom Right) */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/95 backdrop-blur-md pointer-events-none">
          <Eye className="h-3 w-3 text-white/80" />
          <span>{loupeActive ? "Hover/drag to inspect weave" : "Zoom disabled"}</span>
        </div>
      </div>

      {/* Loupe Controls & Detail Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-card/60 px-3.5 py-2 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Fabric & Embroidery Loupe</span>

          {/* Zoom Multiplier Presets */}
          {loupeActive && (
            <div className="ml-1 inline-flex items-center gap-1 bg-muted/80 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setZoomLevel(2.5)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  zoomLevel === 2.5
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                2.5x
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(4.0)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  zoomLevel === 4.0
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                4.0x Ultra
              </button>
            </div>
          )}
        </div>

        {/* Enable / Disable Button */}
        <button
          type="button"
          onClick={toggleZoom}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer active:scale-95 ${
            loupeActive
              ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border"
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              loupeActive ? "bg-emerald-500" : "bg-neutral-400"
            }`}
          />
          <span>{loupeActive ? "Disable zoom" : "Enable zoom"}</span>
        </button>
      </div>
    </div>
  );
}
