"use client";

import { useEffect, useState } from "react";
import { quotes } from "@/lib/content";

export function QuoteRotator({ light = false }: { light?: boolean }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % quotes.length);
        setVisible(true);
      }, 180);
    }, 5600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p
      aria-live="polite"
      className={`min-h-12 font-heading text-xl leading-snug transition-opacity duration-200 sm:text-2xl ${
        light ? "text-paper" : "text-ink"
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {quotes[index]}
    </p>
  );
}
