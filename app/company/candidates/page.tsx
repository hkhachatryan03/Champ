import Link from "next/link";
import { listActiveCandidatePool, parseSkills, CandidateFilters } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import { Ledger, Tag, LanguageTags } from "@/components/ui";
import { ARMENIAN_LOCATIONS } from "@/lib/constants";
import SalaryRangeFilter from "@/components/SalaryRangeFilter";

export default async function CandidatesHubPage({
  searchParams,
}: {
  searchParams: Promise<CandidateFilters>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const filters = await searchParams;
  const candidates = await listActiveCandidatePool(filters);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1 className="font-display font-semibold text-2xl">Candidates</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        {candidates.length} candidates actively looking match your filters
      </p>

      <div className="grid md:grid-cols-[1fr_260px] gap-8 items-start">
        {/* Candidate list */}
        <div className="flex flex-col gap-3 order-2 md:order-1">
          {candidates.map((c) => (
            <Link
              key={c.user_id}
              href={`/company/candidates/${c.user_id}`}
              className="block p-5 rounded-xl border border-line bg-white hover:shadow-sm transition"
            >
              <div className="flex items-center gap-3">
                {c.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <div className="font-display font-semibold text-lg">{c.name || "(unnamed candidate)"}</div>
                  <p className="text-sm text-muted">
                    {c.title} · {c.years_experience} yrs {c.location && `· ${c.location}`}
                  </p>
                </div>
              </div>
              <div className="mt-3"><Ledger min={c.salary_min} max={c.salary_max} /></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {parseSkills(c.skills).map((s) => <Tag key={s}>{s}</Tag>)}
                {!!c.remote_ok && <Tag tone="moss">Remote OK</Tag>}
              </div>
              {JSON.parse(c.languages || "[]").length > 0 && (
                <div className="mt-2"><LanguageTags languages={JSON.parse(c.languages || "[]")} /></div>
              )}
            </Link>
          ))}
          {candidates.length === 0 && (
            <p className="text-sm text-center py-10 text-muted">
              No candidates match — try loosening a filter.
            </p>
          )}
        </div>

        {/* Filters — stacked one under another, on the right */}
        <form method="get" className="order-1 md:order-2 flex flex-col gap-4 p-4 rounded-xl bg-paper-dim md:sticky md:top-4">
          <div>
            <label className="text-xs font-medium text-muted">Position</label>
            <input name="position" defaultValue={filters.position} placeholder="e.g. Backend Engineer" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Location</label>
            <select name="location" defaultValue={filters.location || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
              <option value="">Any</option>
              {ARMENIAN_LOCATIONS.map((loc) => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Minimum experience (years)</label>
            <input name="minExperience" type="number" min={0} defaultValue={filters.minExperience} placeholder="e.g. 3" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white font-mono-num" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Skills</label>
            <input name="skills" defaultValue={filters.skills} placeholder="e.g. React, Go" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white" />
            <p className="text-xs text-muted mt-1">Comma separated — matches any part of a skill name.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Salary ($/mo)</label>
            <div className="mt-1">
              <SalaryRangeFilter minName="salaryMin" maxName="salaryMax" defaultMin={filters.salaryMin} defaultMax={filters.salaryMax} />
            </div>
          </div>
          <button type="submit" className="mt-1 px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper">
            Apply filters
          </button>
        </form>
      </div>
    </div>
  );
}
