"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function MultiCheckDropdown({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
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
