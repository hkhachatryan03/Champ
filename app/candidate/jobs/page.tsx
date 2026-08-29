import Link from "next/link";
import { listActiveJobsWithCompany, parseSkills, JobFilters, getAppliedJobIds, listDistinctJobTitles, listDistinctCompanyNames } from "@/lib/queries";
import { formatPostedAge } from "@/lib/dates";
import { getSession } from "@/lib/auth";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import { Ledger, Tag } from "@/components/ui";
import { ARMENIAN_LOCATIONS, LANGUAGE_OPTIONS } from "@/lib/constants";
import SalaryRangeFilter from "@/components/SalaryRangeFilter";
import ActiveFilterChips, { FilterChip } from "@/components/ActiveFilterChips";
import MultiSelectFilter from "@/components/MultiSelectFilter";

export default async function BrowseJobsPage({
  searchParams,
}: {
  searchParams: Promise<JobFilters>;
}) {
  const filters = await searchParams;
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await requireOnboardedCandidate(session.userId);
  const allJobs = await listActiveJobsWithCompany(filters);
  const jobs = filters.language
    ? allJobs.filter((j) => parseSkills(j.languages || "[]").some((l) => l.toLowerCase().startsWith(filters.language!.toLowerCase())))
    : allJobs;
  const appliedIds = await getAppliedJobIds(session.userId);
  const jobTitleOptions = await listDistinctJobTitles();
  const companyNameOptions = await listDistinctCompanyNames();

  const locationLabel = ARMENIAN_LOCATIONS.find((l) => l.value === filters.location)?.label || filters.location;
  const chips: FilterChip[] = [];
  if (filters.position) {
    filters.position.split(",").filter(Boolean).forEach((p) => chips.push({ key: "position", label: p, removeValue: p }));
  }
  if (filters.company) {
    filters.company.split(",").filter(Boolean).forEach((c) => chips.push({ key: "company", label: c, removeValue: c }));
  }
  if (filters.category) chips.push({ key: "category", label: filters.category });
  if (filters.employmentType) chips.push({ key: "employmentType", label: filters.employmentType });
  if (filters.experienceLevel) chips.push({ key: "experienceLevel", label: filters.experienceLevel });
  if (filters.remote) chips.push({ key: "remote", label: filters.remote === "remote" ? "Remote" : "On-site" });
  if (filters.location) chips.push({ key: "location", label: locationLabel! });
  if (filters.language) chips.push({ key: "language", label: filters.language });
  if (filters.salaryMin || filters.salaryMax) {
    const label = filters.salaryMin && filters.salaryMax
      ? `$${filters.salaryMin}–$${filters.salaryMax}`
      : filters.salaryMin
      ? `$${filters.salaryMin}+`
      : `up to $${filters.salaryMax}`;
    chips.push({ key: ["salaryMin", "salaryMax"], label });
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1 className="font-display font-semibold text-2xl">All roles</h1>
      <p className="text-sm text-muted mt-1 mb-4">{jobs.length} roles match your filters</p>
      <ActiveFilterChips chips={chips} basePath="/candidate/jobs" currentParams={filters as Record<string, string | undefined>} />
      <div className="grid md:grid-cols-[1fr_260px] gap-8 items-start">
        {/* Job list — everything stacked vertically */}
        <div className="flex flex-col gap-3 order-2 md:order-1">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/candidate/jobs/${job.id}`}
              className="block p-5 rounded-xl border border-line bg-white hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-lg">{job.title}</h3>
                    {appliedIds.has(job.id) && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-moss/15 text-moss whitespace-nowrap">
                        ✓ Applied
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-0.5">
                    {job.company_name} · {job.location}
                  </p>
                </div>
                <span className="text-xs text-muted whitespace-nowrap">{formatPostedAge(job.created_at)}</span>
              </div>
              <div className="mt-4">
                <Ledger min={job.salary_min} max={job.salary_max} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag tone="moss">{job.category}</Tag>
                <Tag>{job.employment_type}</Tag>
                {job.experience_level && <Tag>{job.experience_level}</Tag>}
                {!!job.remote && <Tag tone="moss">Remote</Tag>}
                {parseSkills(job.skills).map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </Link>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-center py-10 text-muted">
              No roles match — try loosening a filter.
            </p>
          )}
        </div>

        {/* Filters — stacked one under another, on the right */}
        <form method="get" className="order-1 md:order-2 flex flex-col gap-4 p-4 rounded-xl bg-paper-dim md:sticky md:top-4">
          <div>
            <label className="text-xs font-medium text-muted">Position</label>
            <MultiSelectFilter name="position" options={jobTitleOptions} initial={filters.position ? filters.position.split(",") : []} placeholder="Type to search…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Company</label>
            <MultiSelectFilter name="company" options={companyNameOptions} initial={filters.company ? filters.company.split(",") : []} placeholder="Type to search…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Category</label>
            <select name="category" defaultValue={filters.category || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
              <option value="">Any</option>
              <option>Tech</option>
              <option>Non-tech</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Employment type</label>
            <select name="employmentType" defaultValue={filters.employmentType || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
              <option value="">Any</option>
              <option>Full-time</option>
              <option>Part-time</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Experience level</label>
            <select name="experienceLevel" defaultValue={filters.experienceLevel || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
              <option value="">Any</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Remote / on-site</label>
            <select name="remote" defaultValue={filters.remote || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
              <option value="">Any</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Location</label>
            <select name="location" defaultValue={filters.location || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
              <option value="">Any</option>
              {ARMENIAN_LOCATIONS.map((loc) => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Language</label>
            <select name="language" defaultValue={filters.language || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
              <option value="">Any</option>
              {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
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
