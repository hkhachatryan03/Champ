import Link from "next/link";

export type FilterChip = {
  key: string | string[]; // param name(s) this chip clears when removed
  label: string;
  removeValue?: string; // if set, only this value is removed from a comma-separated list, not the whole param
};

export default function ActiveFilterChips({
  chips,
  basePath,
  currentParams,
}: {
  chips: FilterChip[];
  basePath: string;
  currentParams: Record<string, string | undefined>;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip, i) => {
        const keysToRemove = Array.isArray(chip.key) ? chip.key : [chip.key];
        const params = new URLSearchParams();
        Object.entries(currentParams).forEach(([k, v]) => {
          if (!v) return;
          if (keysToRemove.includes(k)) {
            if (chip.removeValue) {
              // Only strip this one value out of a comma-separated list —
              // the rest of the selections for this filter stay intact.
              const remaining = v.split(",").filter((x) => x && x !== chip.removeValue);
              if (remaining.length) params.set(k, remaining.join(","));
            }
            // else: drop the key entirely (clearing the whole filter)
          } else {
            params.set(k, v);
          }
        });
        const href = params.toString() ? `${basePath}?${params.toString()}` : basePath;
        return (
          <Link
            key={`${keysToRemove.join(",")}-${chip.removeValue || i}`}
            href={href}
            className="text-xs px-2.5 py-1 rounded-full bg-ink text-paper flex items-center gap-1.5 hover:opacity-80"
          >
            {chip.label}
            <span className="text-paper/70">✕</span>
          </Link>
        );
      })}
    </div>
  );
}
