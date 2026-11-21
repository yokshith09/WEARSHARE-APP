"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "zoom";
  distance?: number;
  duration?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  direction = "up",
  distance = 24,
  duration = 0.65,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;

    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      setIsVisible(true);
      return;
    }

    // Check if element is already in or near viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight + 50) {
      // Only hide if genuinely below the viewport fold
      setIsVisible(false);
    } else {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.01,
        rootMargin: "0px 0px 80px 0px",
      }
    );

    observer.observe(el);

    // Safety fallback: ensure nothing stays permanently hidden
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, Math.max(delayMs + 400, 600));

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [delayMs]);

  const getTransform = () => {
    if (!mounted || isVisible) return "none";
    switch (direction) {
      case "up":
        return `translate3d(0, ${distance}px, 0)`;
      case "down":
        return `translate3d(0, -${distance}px, 0)`;
      case "left":
        return `translate3d(${distance}px, 0, 0)`;
      case "right":
        return `translate3d(-${distance}px, 0, 0)`;
      case "zoom":
        return `translate3d(0, ${distance / 2}px, 0) scale(0.96)`;
      case "fade":
      default:
        return "none";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: !mounted || isVisible ? 1 : 0,
        transform: getTransform(),
        transition: mounted
          ? `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`
          : "none",
        willChange: "opacity, transform",
      }}
      className={className}
    >
      {children}
    </div>
  );
}
