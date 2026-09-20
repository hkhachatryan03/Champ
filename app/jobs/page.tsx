import Link from "next/link";
import {
  listActiveJobsWithCompany,
  parseSkills,
  JobFilters,
  listDistinctJobTitles,
  listDistinctCompanyNames,
} from "@/lib/queries";
import { formatPostedAge } from "@/lib/dates";
import { Ledger, Tag } from "@/components/ui";
import { ARMENIAN_LOCATIONS, LANGUAGE_OPTIONS } from "@/lib/constants";
import SalaryRangeFilter from "@/components/SalaryRangeFilter";
import ActiveFilterChips, { FilterChip } from "@/components/ActiveFilterChips";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import JobCard from "@/components/JobCard";

// Public — no login required. Anyone can browse what's posted; applying
// (or seeing full contact/chat features) requires signing up, same as any
// job board works.
export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<JobFilters>;
}) {
  const filters = await searchParams;
  const allJobs = await listActiveJobsWithCompany(filters);
  const jobs = filters.language
    ? allJobs.filter((j) => parseSkills(j.languages || "[]").some((l) => l.toLowerCase().startsWith(filters.language!.toLowerCase())))
    : allJobs;
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
      <h1 className="font-display font-semibold text-2xl">Open roles</h1>
      <p className="text-sm text-muted mt-1 mb-4">
        {jobs.length} roles posted right now.{" "}
        <Link href="/signup?role=candidate" className="underline text-apricot-deep">Sign up</Link> to apply or message a recruiter directly.
      </p>
      <ActiveFilterChips chips={chips} basePath="/jobs" currentParams={filters as Record<string, string | undefined>} />

      <div className="grid md:grid-cols-[1fr_260px] gap-8 items-start">
        <div className="flex flex-col gap-3 order-2 md:order-1">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} applied={false} href={`/jobs/${job.id}`} />
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-center py-10 text-muted">No roles match — try loosening a filter.</p>
          )}
        </div>

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
