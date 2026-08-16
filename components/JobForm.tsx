export default function JobForm({
  action,
  defaults,
  isEdit,
}: {
  action: (formData: FormData) => void;
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
  };
  isEdit?: boolean;
}) {
  const d = defaults || {};
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium text-muted">Role title</label>
        <input name="title" defaultValue={d.title} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      </div>
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
          <input name="location" defaultValue={d.location} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input type="checkbox" name="remote" defaultChecked={!!d.remote} /> Remote OK
        </label>
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Key skills (comma separated, optional)</label>
        <input name="skills" defaultValue={d.skills} placeholder="Go, PostgreSQL, AWS" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Languages needed (optional)</label>
        <input name="languages" defaultValue={d.languages} placeholder="English:C1, Russian:B2" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        <p className="text-xs text-muted mt-1">Format: Language:Level, separated by commas.</p>
      </div>
      <div>
        <label className="text-xs font-medium text-muted">Description (required — this is what candidates see)</label>
        <textarea name="description" defaultValue={d.description} required rows={4} placeholder="What will they actually be doing? What's the team like?" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
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
      <button type="submit" className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
        {isEdit ? "Save changes" : "Publish role"}
      </button>
    </form>
  );
}
