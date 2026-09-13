"use client";

import { useState } from "react";
import type { Education } from "@/lib/queries";
import SingleAutocomplete from "@/components/SingleAutocomplete";

export default function EducationItem({
  education,
  degreeOptions,
  institutionOptions,
  onUpdate,
  onDelete,
}: {
  education: Education;
  degreeOptions: string[];
  institutionOptions: string[];
  onUpdate: (id: number, formData: FormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  if (!editing) {
    return (
      <div className="p-3 rounded-lg border border-line bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{education.institution}</div>
            <div className="text-xs text-muted">
              {education.degree}{education.field_of_study && ` · ${education.field_of_study}`}
            </div>
            {education.start_year && (
              <div className="text-xs text-muted font-mono-num">{education.start_year} – {education.end_year || "Present"}</div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted underline">
              Edit
            </button>
            <button type="button" onClick={() => onDelete(education.id)} className="text-xs text-muted underline">
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
        await onUpdate(education.id, new FormData(e.currentTarget));
        setPending(false);
        setEditing(false);
      }}
    >
      <SingleAutocomplete name="institution" options={institutionOptions} defaultValue={education.institution} required />
      <select name="degree" defaultValue={education.degree} required className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none">
        {degreeOptions.map((d) => <option key={d}>{d}</option>)}
      </select>
      <input name="fieldOfStudy" defaultValue={education.field_of_study} placeholder="Field of study (optional)" className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      <div className="flex gap-2 items-center">
        <input name="startYear" type="number" defaultValue={education.start_year ?? undefined} placeholder="Start year" className="w-28 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
        <span className="text-sm text-muted">to</span>
        <input name="endYear" type="number" defaultValue={education.end_year ?? undefined} placeholder="End (blank = present)" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
      </div>
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
