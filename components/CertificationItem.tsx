"use client";

import { useState } from "react";
import type { Certification } from "@/lib/queries";
import { Pencil, Trash2 } from "lucide-react";

export default function CertificationItem({
  certification,
  onUpdate,
  onDelete,
  glass = false,
}: {
  certification: Certification;
  onUpdate: (id: number, formData: FormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  /** Dark "Ethereal Glass" look. Default = original light card. */
  glass?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  if (!editing && glass) {
    const certHref = certification.link_url || certification.file_url || "#";
    const hasCert = !!(certification.link_url || certification.file_url);
    return (
      <div className="aur-entry">
        <div className="flex items-start justify-between gap-3.5 max-md:flex-col">
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-paper">{certification.name}</div>
            {(certification.provider || hasCert) && (
              <div className="text-xs text-paper/55 flex items-center gap-1.5 flex-wrap mt-0.5">
                {certification.provider}
                {certification.provider && hasCert && <span>·</span>}
                {hasCert && (
                  <a href={certHref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-[3px] text-apricot">
                    View certificate →
                  </a>
                )}
              </div>
            )}
            {certification.issue_date && (
              <div className="text-xs text-paper/50 font-mono-num mt-0.5">
                {new Date(certification.issue_date + "-02").toLocaleDateString(undefined, { year: "numeric", month: "long" })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button type="button" onClick={() => setEditing(true)} className="aur-entry-btn"><Pencil size={13} strokeWidth={1.5} /> Edit</button>
            <button type="button" onClick={() => onDelete(certification.id)} className="aur-entry-btn"><Trash2 size={13} strokeWidth={1.5} /> Remove</button>
          </div>
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="p-3 rounded-lg border border-line bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{certification.name}</div>
            {certification.provider && (
              <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
                {certification.provider}
                {(certification.link_url || certification.file_url) && (
                  <>
                    <span>·</span>
                    <a href={certification.link_url || certification.file_url || "#"} target="_blank" rel="noopener noreferrer" className="underline text-apricot-deep">
                      View certificate →
                    </a>
                  </>
                )}
              </div>
            )}
            {!certification.provider && (certification.link_url || certification.file_url) && (
              <a href={certification.link_url || certification.file_url || "#"} target="_blank" rel="noopener noreferrer" className="text-xs underline text-apricot-deep">
                View certificate →
              </a>
            )}
            {certification.issue_date && (
              <div className="text-xs text-muted font-mono-num">
                {new Date(certification.issue_date + "-02").toLocaleDateString(undefined, { year: "numeric", month: "long" })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted underline">
              Edit
            </button>
            <button type="button" onClick={() => onDelete(certification.id)} className="text-xs text-muted underline">
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (glass) {
    return (
      <form
        className="aur-entry aur-entry-editing flex flex-col gap-2.5"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          await onUpdate(certification.id, new FormData(e.currentTarget));
          setPending(false);
          setEditing(false);
        }}
      >
        <input name="certName" defaultValue={certification.name} required placeholder="Certificate name" className="aur-field" />
        <input name="certIssueDate" type="month" defaultValue={certification.issue_date || ""} required max={new Date().toISOString().slice(0, 7)} className="aur-field" />
        <input name="certProvider" defaultValue={certification.provider} placeholder="Issued by (optional)" className="aur-field" />
        <input name="certLink" defaultValue={certification.link_url || ""} placeholder="Link (optional)" className="aur-field" />
        {certification.file_url && !certification.link_url && (
          <p className="text-xs leading-[1.55] text-paper/50">
            An attached file is on record for this certificate — leave the link blank to keep it, or add a
            link above if you&apos;d rather point to that instead. To replace the attached file itself, remove
            this entry and add it again.
          </p>
        )}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="aur-btn-sm">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="text-sm text-paper/60 hover:text-paper transition-colors">Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="p-3 rounded-lg border border-apricot/40 bg-white flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        await onUpdate(certification.id, new FormData(e.currentTarget));
        setPending(false);
        setEditing(false);
      }}
    >
      <input name="certName" defaultValue={certification.name} required placeholder="Certificate name" className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      <input name="certIssueDate" type="month" defaultValue={certification.issue_date || ""} required max={new Date().toISOString().slice(0, 7)} className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      <input name="certProvider" defaultValue={certification.provider} placeholder="Issued by (optional)" className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      <input name="certLink" defaultValue={certification.link_url || ""} placeholder="Link (optional)" className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      {certification.file_url && !certification.link_url && (
        <p className="text-xs text-muted">
          An attached file is on record for this certificate — leave the link blank to keep it, or add a
          link above if you&apos;d rather point to that instead. To replace the attached file itself, remove
          this entry and add it again.
        </p>
      )}
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
