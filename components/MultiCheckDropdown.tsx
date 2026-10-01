"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function MultiCheckDropdown({
  name,
  label,
  options,
  glass = false,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  /** Dark "Ethereal Glass" look. Default = original light dropdown (company inbox). */
  glass?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = (searchParams.get(name) || "").split(",").filter(Boolean);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (value: string) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set(name, next.join(","));
    else params.delete(name);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const displayLabel = current.length === 0 ? `Any ${label}` : `${label} (${current.length})`;
  const glassLabel = label.charAt(0).toUpperCase() + label.slice(1);

  if (glass) {
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all duration-300 ${
            current.length > 0
              ? "bg-apricot/[.12] border-apricot/40 text-paper"
              : "bg-[var(--glass)] border-paper/15 text-paper/80 hover:border-paper/30"
          }`}
        >
          {glassLabel}
          {current.length > 0 && <span className="text-paper/70">· {current.length}</span>}
          <ChevronDown size={12} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
        <div
          className={`absolute z-30 top-[calc(100%+8px)] right-0 max-md:left-0 max-md:right-auto min-w-[220px] max-h-64 overflow-y-auto p-1.5 rounded-[18px] bg-[#15181d]/95 backdrop-blur-xl border border-paper/15 shadow-[0_24px_50px_-20px_rgba(0,0,0,.9)] transition-all duration-300 ${
            open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1.5 pointer-events-none"
          }`}
        >
          {options.map((o) => (
            <label key={o.value} className="aur-check !gap-[11px] px-3 py-2 rounded-xl hover:bg-paper/[.07] whitespace-nowrap !text-[13.5px] !text-paper/85">
              <input type="checkbox" checked={current.includes(o.value)} onChange={() => toggle(o.value)} />
              <span className="aur-check-box !w-[18px] !h-[18px] !rounded-md"><Check size={11} strokeWidth={2.4} /></span>
              {o.label}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
          current.length > 0 ? "bg-ink text-paper border-ink" : "bg-paper-dim text-muted border-line"
        }`}
      >
        {displayLabel} ▾
      </button>
      {open && (
        <div className="absolute z-20 mt-1 bg-white border border-line rounded-lg shadow-sm p-2 min-w-[180px] max-h-56 overflow-y-auto">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm px-2 py-1.5 hover:bg-paper-dim rounded cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={current.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
