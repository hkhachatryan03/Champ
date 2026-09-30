"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

/**
 * Wraps the (server-rendered) jobs filter form. On desktop it's always
 * visible and sticky; on phones it collapses behind a "Filters" button.
 * Purely presentational: the <form> passed in as children is untouched and
 * keeps submitting exactly as before (it stays mounted while collapsed).
 */
export default function FilterPanel({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="order-1 md:order-2 md:sticky md:top-[92px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="jobs-filters"
        className="md:hidden flex w-full items-center justify-center gap-2.5 py-3 rounded-full border border-paper/15 bg-[var(--glass)] text-paper text-sm font-medium transition-colors hover:border-paper/30 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-apricot"
      >
        <SlidersHorizontal size={16} strokeWidth={1.25} />
        Filters
        {activeCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-apricot/20 text-apricot text-xs">{activeCount} active</span>
        )}
      </button>
      <div id="jobs-filters" className={`${open ? "block" : "hidden"} md:block mt-3 md:mt-0`}>
        {children}
      </div>
    </div>
  );
}
