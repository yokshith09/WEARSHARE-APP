"use client";

import { useRef, useState, MouseEvent } from "react";
import { ZoomIn, Eye } from "lucide-react";

interface FabricZoomLoupeProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
}

export function FabricZoomLoupe({
  src,
  alt,
  className = "",
  zoomLevel = 2.4,
}: FabricZoomLoupeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [loupeActive, setLoupeActive] = useState(true);

  const LENS_SIZE = 140;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !loupeActive) return;
    const rect = containerRef.current.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Constrain lens within image bounds
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

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-[4/5] lg:aspect-[5/6] max-h-[720px] overflow-hidden rounded-xl bg-muted shadow-xl border border-border cursor-crosshair select-none"
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover object-top transition-transform duration-200"
        />

        {/* Loupe Lens */}
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
            className="absolute left-0 top-0 z-30 rounded-full border-2 border-white shadow-[0_0_25px_rgba(0,0,0,0.45)] ring-1 ring-black/20"
          >
            {/* Optical center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="h-4 w-px bg-white" />
              <div className="h-px w-4 bg-white" />
            </div>
            {/* Glass sheen */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/40" />
          </div>
        )}

        {/* Hover hint tag */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md transition-opacity duration-300">
          <ZoomIn className="h-3 w-3 text-primary-foreground" />
          <span>{loupeActive ? "Hover to inspect weave" : "Fabric zoom off"}</span>
        </div>
      </div>

      {/* Loupe toggle */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-primary" />
          <span>Micro-texture & Zardozi embroidery loupe ({zoomLevel}x)</span>
        </span>
        <button
          type="button"
          onClick={() => setLoupeActive(!loupeActive)}
          className="font-medium text-primary hover:underline"
        >
          {loupeActive ? "Disable zoom" : "Enable zoom"}
        </button>
      </div>
    </div>
  );
}
