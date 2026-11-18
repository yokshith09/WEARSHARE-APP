"use client";

import { useRef, useState, MouseEvent } from "react";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
}

export function Card3D({ children, className = "" }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (-12deg to 12deg max)
    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);

    // Glare position in percentages
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.25 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className={`relative transition-all duration-200 ease-out ${className}`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
          transformStyle: "preserve-3d",
          transition: rotateX === 0 ? "transform 0.5s ease-out" : "transform 0.1s ease-out",
        }}
        className="relative overflow-hidden rounded-2xl will-change-transform"
      >
        {children}

        {/* Dynamic Holographic / Specular Sheen Layer */}
        <div
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 45%, transparent 70%)`,
            opacity: glarePos.opacity,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
          className="absolute inset-0 z-20 mix-blend-overlay"
        />
      </div>
    </div>
  );
}

