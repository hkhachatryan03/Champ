"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps children and fades/slides them up once they scroll into view.
 * Pure presentation — no effect on layout, data, or functionality of
 * whatever it wraps. Respects prefers-reduced-motion via the .aur-reveal
 * CSS in globals.css (falls back to always-visible there).
 */
export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`aur-reveal ${visible ? "aur-in" : ""} ${className}`}>
      {children}
    </div>
  );
}
