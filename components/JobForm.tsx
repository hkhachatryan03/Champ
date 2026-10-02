"use client";

import { useActionState, useState } from "react";
import TagPicker from "./TagPicker";
import LanguagePicker from "./LanguagePicker";
import LocationSelect from "./LocationSelect";
import RichEditor from "./RichEditor";
import UnsavedChangesGuard from "./UnsavedChangesGuard";
import { COMMON_SKILLS } from "@/lib/constants";
import { ArrowRight, Check } from "lucide-react";

export type JobFormState = { error?: string } | null;

export default function JobForm({
  action,
  defaults,
  isEdit,
  cancelHref,
  skillOptions,
  showClientNameField,
  glass = false,
}: {
  action: (prevState: JobFormState, formData: FormData) => Promise<JobFormState>;
  defaults?: {
    title?: string;
    category?: string;
    employment_type?: string;
    location?: string;
    remote?: number;
    salary_min?: number;
    salary_max?: number;
    skills?: string;
    description?: string;
    active?: number;
    experience_level?: string | null;
    languages?: string;
    client_name?: string;
  };
  isEdit?: boolean;
  cancelHref: string;
  skillOptions?: string[];
  showClientNameField?: boolean;
  /** Dark "Ethereal Glass" look. Default = original light form. */
  glass?: boolean;
}) {
  const d = defaults || {};

  // When the server answers with a validation error, React clears the plain form
  // fields. Remember what was typed so the person doesn't have to re-enter it
  // (the skills, languages and description keep their own state already).
  const [typed, setTyped] = useState<Record<string, string> | null>(null);
  const [errKey, setErrKey] = useState(0);
  const wrappedAction = async (prev: JobFormState, formData: FormData): Promise<JobFormState> => {
    const result = await action(prev, formData);
    if (result?.error) {
      const snapshot: Record<string, string> = {};
      formData.forEach((v, k) => {
        if (typeof v === "string") snapshot[k] = v;
      });
      setTyped(snapshot);
      setErrKey((n) => n + 1);
    }
    return result;
  };
  const [state, formAction, isPending] = useActionState<JobFormState, FormData>(wrappedAction, null);
  const val = (name: string, fallback: string | number | null | undefined) => (typed ? typed[name] ?? "" : fallback ?? "");
  const checked = (name: string, fallback: boolean) => (typed ? name in typed : fallback);


  if (glass) {
    const skillsInitial = d.skills ? d.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const languagesInitial = d.languages ? d.languages.split(",").map((s) => s.trim()).filter(Boolean) : [];
    return (
      <>
        <form id="jobPostingForm" action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="aur-alert !text-[13.5px] !leading-[1.5] !px-3.5 !py-[11px] !rounded-[13px]">{state.error}</div>
          )}

          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>The role</h3>
              <div>
                <label className="aur-label">Role title</label>
                <input key={`title${errKey}`} name="title" defaultValue={val("title", d.title)} required placeholder="e.g. Senior Backend Engineer" className="aur-field" />
              </div>
              {showClientNameField && (
                <div>
                  <label className="aur-label">Hiring on behalf of (optional)</label>
                  <input key={`client${errKey}`} name="clientName" defaultValue={val("clientName", d.client_name)} placeholder="e.g. Lusar Labs" className="aur-field" />
                  <p className="text-xs leading-[1.55] text-paper/50 mt-1.5">
                    Shown to candidates as who they&apos;d actually be working for. Leave blank if you&apos;re not recruiting for a named client.
                  </p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="aur-label">Category</label>
                  <select key={`cat${errKey}`} name="category" defaultValue={String(val("category", d.category || "Tech"))} className="aur-field">
                    <option>Tech</option>
                    <option>Non-tech</option>
                  </select>
                </div>
                <div>
                  <label className="aur-label">Employment type</label>
                  <select key={`emp${errKey}`} name="employmentType" defaultValue={String(val("employmentType", d.employment_type || "Full-time"))} className="aur-field">
                    <option>Full-time</option>
                    <option>Part-time</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="aur-label">Experience level (optional)</label>
                <select key={`exp${errKey}`} name="experienceLevel" defaultValue={String(val("experienceLevel", d.experience_level || ""))} className="aur-field">
                  <option value="">Not specified</option>
                  <option>Junior</option>
                  <option>Mid</option>
                  <option>Senior</option>
                  <option>Lead</option>
                </select>
              </div>
            </div>
          </div>

          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>Where &amp; pay</h3>
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="aur-label">Location</label>
                  <LocationSelect key={`loc${errKey}`} glass name="location" defaultValue={String(val("location", d.location))} required />
                </div>
                <label className="aur-check !text-sm pb-[11px]">
                  <input key={`rem${errKey}`} type="checkbox" name="remote" defaultChecked={checked("remote", !!d.remote)} />
                  <span className="aur-check-box"><Check size={12} strokeWidth={2.4} /></span>
                  Remote OK
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="aur-label">Salary min ($/mo)</label>
                  <input key={`smin${errKey}`} name="salaryMin" type="number" defaultValue={val("salaryMin", d.salary_min)} required placeholder="e.g. 2000" className="aur-field font-mono-num" />
                </div>
                <div>
                  <label className="aur-label">Salary max ($/mo)</label>
                  <input key={`smax${errKey}`} name="salaryMax" type="number" defaultValue={val("salaryMax", d.salary_max)} required placeholder="e.g. 3000" className="aur-field font-mono-num" />
                </div>
              </div>
              <p className="text-xs leading-[1.55] text-paper/50">A visible salary range is required to post — it&apos;s the whole point of Champ.</p>
            </div>
          </div>

          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>Skills &amp; languages</h3>
              <div>
                <label className="aur-label">Key skills (optional)</label>
                <TagPicker glass name="skills" options={skillOptions || COMMON_SKILLS} initial={skillsInitial} />
              </div>
              <div>
                <label className="aur-label">Languages needed (optional)</label>
                <LanguagePicker glass name="languages" initial={languagesInitial} />
              </div>
            </div>
          </div>

          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>Description</h3>
              <p className="text-xs leading-[1.55] text-paper/50 -mt-1">Required — this is what candidates see.</p>
              <RichEditor glass name="description" defaultValue={d.description} required minHeight={140} placeholder="What will they actually be doing? What's the team like?" />
            </div>
          </div>

          {isEdit && (
            <div className="aur-bezel-sm">
              <label className="aur-bezel-inner flex items-center justify-between gap-4 px-[22px] py-[18px] cursor-pointer">
                <span>
                  <span className="block text-[14.5px] font-medium text-paper">Active (visible to candidates)</span>
                  <span className="block text-[12.5px] text-paper/55 mt-[3px]">Uncheck to pause this role.</span>
                </span>
                <span className="aur-switchcb">
                  <input key={`act${errKey}`} type="checkbox" name="active" defaultChecked={checked("active", !!d.active)} />
                  <span className="aur-switchcb-track" />
                </span>
              </label>
            </div>
          )}

          <div className="aur-savebar">
            <span className="aur-savehint">
              <span className="aur-sh-clean">{isEdit ? "All changes saved" : "Not published yet"}</span>
              <span className="aur-sh-dirty">{isEdit ? "You have unsaved changes" : "Not published yet — you have changes"}</span>
            </span>
            <div className="flex items-center gap-1.5 max-md:w-full max-md:justify-between">
              <a href={cancelHref} className="px-4 py-2.5 text-[13.5px] text-paper/65 hover:text-paper underline underline-offset-[3px] transition-colors">
                Cancel
              </a>
              <button type="submit" disabled={isPending} className="aur-btn aur-btn-primary aur-btn-shine !py-3 !pl-[22px] !pr-2 disabled:opacity-60">
                {isEdit ? "Save changes" : "Publish role"}
                <span className="aur-btn-icon"><ArrowRight size={14} /></span>
              </button>
            </div>
          </div>
        </form>
        <UnsavedChangesGuard glass formId="jobPostingForm" />
      </>
    );
  }

  return (
    <>
    <form id="jobPostingForm" action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <div className="text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-muted">Role title</label>
        <input name="title" defaultValue={d.title} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      </div>
      {showClientNameField && (
        <div>
          <label className="text-xs font-medium text-muted">Hiring on behalf of (optional)</label>
          <input
            name="clientName"
            defaultValue={d.client_name}
            placeholder="e.g. Lusar Labs"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none"
          />
          <p className="text-xs text-muted mt-1">
            Shown to candidates as who they&apos;d actually be working for. Leave blank if you&apos;re not recruiting for a named client.
          </p>
        </div>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted">Category</label>
          <select name="category" defaultValue={d.category || "Tech"} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none">
            <option>Tech</option>
            <option>Non-tech</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted">Employment type</label>
          <select name="employmentType" defaultValue={d.employment_type || "Full-time"} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none">
            <option>Full-time</option>
            <option>Part-time</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Experience level (optional)</label>
        <select name="experienceLevel" defaultValue={d.experience_level || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none">
          <option value="">Not specified</option>
          <option>Junior</option>
          <option>Mid</option>
          <option>Senior</option>
          <option>Lead</option>
        </select>
      </div>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted">Location</label>
          <div className="mt-1"><LocationSelect name="location" defaultValue={d.location} required /></div>
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input type="checkbox" name="remote" defaultChecked={!!d.remote} /> Remote OK
        </label>
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Key skills (optional)</label>
        <div className="mt-1"><TagPicker name="skills" options={skillOptions || COMMON_SKILLS} initial={d.skills ? d.skills.split(",").map((s) => s.trim()).filter(Boolean) : []} /></div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Languages needed (optional)</label>
        <div className="mt-1"><LanguagePicker name="languages" initial={d.languages ? d.languages.split(",").map((s) => s.trim()).filter(Boolean) : []} /></div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Description (required — this is what candidates see)</label>
        <RichEditor name="description" defaultValue={d.description} required minHeight={110} placeholder="What will they actually be doing? What's the team like?" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted">Salary min ($/mo)</label>
          <input name="salaryMin" type="number" defaultValue={d.salary_min} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted">Salary max ($/mo)</label>
          <input name="salaryMax" type="number" defaultValue={d.salary_max} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
        </div>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm p-3 rounded-lg border border-line">
          <input type="checkbox" name="active" defaultChecked={!!d.active} />
          Active (visible to candidates) — uncheck to pause this role
        </label>
      )}

      <p className="text-xs text-muted">A visible salary range is required to post — it&apos;s the whole point of Champ.</p>
      <div className="flex items-center gap-3 mt-2">
        <button type="submit" disabled={isPending} className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit disabled:opacity-60">
          {isEdit ? "Save changes" : "Publish role"}
        </button>
        <a href={cancelHref} className="text-sm text-muted underline">
          Cancel
        </a>
      </div>
    </form>
    <UnsavedChangesGuard formId="jobPostingForm" />
    </>
  );
}
