"use client";

import { useEffect, useRef, useState } from "react";

interface TextRevealProps {
  text: string;
  className?: string;
  /** Render specific words differently, e.g. italic/colored */
  highlight?: { words: string[]; className: string };
  /** ms between each word appearing */
  staggerMs?: number;
  /** Animation duration per word in seconds */
  duration?: number;
}

/**
 * Staggered word-by-word reveal animation for hero headings.
 * SSR-safe: renders full text visible during SSR, animates on client mount.
 */
export function TextReveal({
  text,
  className = "",
  highlight,
  staggerMs = 90,
  duration = 0.5,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation after a tick so CSS transitions kick in
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const words = text.split(/\s+/);

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => {
        const isHighlight =
          highlight && highlight.words.some((hw) => word.toLowerCase().includes(hw.toLowerCase()));
        return (
          <span
            key={i}
            className="inline-block overflow-hidden"
            style={{ marginRight: "0.28em" }}
          >
            <span
              className={`inline-block ${isHighlight ? highlight!.className : ""}`}
              style={{
                transform: animate ? "translateY(0)" : "translateY(110%)",
                opacity: animate ? 1 : 0,
                transition: `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerMs}ms, opacity ${duration * 0.6}s ease ${i * staggerMs}ms`,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </span>
  );
}
