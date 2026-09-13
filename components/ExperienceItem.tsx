"use client";

import { useState } from "react";
import type { Experience } from "@/lib/queries";

export default function ExperienceItem({
  experience,
  onUpdate,
  onDelete,
}: {
  experience: Experience;
  onUpdate: (id: number, formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!editing) {
    return (
      <div className="p-3 rounded-lg border border-line bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{experience.title} · {experience.company}</div>
            <div className="text-xs text-muted font-mono-num">{experience.start_year} – {experience.end_year || "Present"}</div>
            {experience.description && (
              <p className="text-sm text-muted mt-1.5 whitespace-pre-line">{experience.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted underline">
              Edit
            </button>
            <button type="button" onClick={() => onDelete(experience.id)} className="text-xs text-muted underline">
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="p-3 rounded-lg border border-apricot/40 bg-white flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const result = await onUpdate(experience.id, new FormData(e.currentTarget));
        setPending(false);
        if (result.ok) setEditing(false);
        else setError(result.error || "Something went wrong.");
      }}
    >
      {error && <p className="text-xs text-apricot-deep">{error}</p>}
      <div className="flex gap-2">
        <input name="title" defaultValue={experience.title} required placeholder="Role title" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        <input name="company" defaultValue={experience.company} required placeholder="Company" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      </div>
      <div className="flex gap-2 items-center">
        <input name="startYear" type="number" defaultValue={experience.start_year} required placeholder="Start year" className="w-28 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
        <span className="text-sm text-muted">to</span>
        <input name="endYear" type="number" defaultValue={experience.end_year ?? undefined} placeholder="End (blank = present)" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
      </div>
      <textarea
        name="description"
        defaultValue={experience.description}
        rows={3}
        placeholder="What did you do in this role? (optional)"
        className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none resize-none"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper w-fit">
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
