"use client";

import { useEffect, useRef, useState } from "react";

interface TextRevealProps {
  text: string;
  className?: string;
  /** Render specific words differently, e.g. italic/colored */
  highlight?: { words: string[]; className: string };
  /** ms to delay before starting this text block */
  delayOffsetMs?: number;
  /** ms between each word appearing */
  staggerMs?: number;
  /** Animation duration per word in seconds */
  duration?: number;
}

/**
 * Staggered word-by-word reveal animation for hero headings.
 * Includes ample ascender/descender headroom so italic fonts like Fraunces are 100% visible.
 */
export function TextReveal({
  text,
  className = "",
  highlight,
  delayOffsetMs = 0,
  staggerMs = 85,
  duration = 0.55,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const words = text.split(/\s+/).filter(Boolean);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {words.map((word, i) => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
        const isHighlight =
          highlight &&
          highlight.words.some(
            (hw) => cleanWord === hw.toLowerCase().replace(/[^\w]/g, "")
          );
        return (
          <span
            key={i}
            className="inline-block overflow-hidden align-top"
            style={{
              marginRight: "0.26em",
              paddingTop: "0.22em",
              paddingBottom: "0.22em",
              paddingLeft: "0.08em",
              paddingRight: "0.22em",
              marginTop: "-0.22em",
              marginBottom: "-0.22em",
              marginLeft: "-0.08em",
            }}
          >
            <span
              className={`inline-block ${isHighlight ? highlight!.className : ""}`}
              style={{
                transform: animate ? "translateY(0)" : "translateY(120%)",
                opacity: animate ? 1 : 0,
                transition: `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delayOffsetMs + i * staggerMs}ms, opacity ${duration * 0.7}s ease ${delayOffsetMs + i * staggerMs}ms`,
                willChange: "transform, opacity",
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
