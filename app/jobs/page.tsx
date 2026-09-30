import Link from "next/link";
import {
  listActiveJobsWithCompany,
  parseSkills,
  JobFilters,
  listDistinctJobTitles,
  listDistinctCompanyNames,
} from "@/lib/queries";
import { ARMENIAN_LOCATIONS, LANGUAGE_OPTIONS } from "@/lib/constants";
import SalaryRangeFilter from "@/components/SalaryRangeFilter";
import ActiveFilterChips, { FilterChip } from "@/components/ActiveFilterChips";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import JobCard from "@/components/JobCard";
import GuestPage from "@/components/GuestPage";
import Reveal from "@/components/Reveal";
import FilterPanel from "@/components/FilterPanel";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

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
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-5xl mx-auto">
        <h1 className="aur-hero-in font-display font-semibold text-[clamp(34px,5vw,44px)] text-paper leading-[1.1]">
          Open roles
        </h1>
        <p className="aur-hero-in text-[15px] text-paper/60 mt-2.5" style={{ animationDelay: ".1s" }}>
          {jobs.length} roles posted right now.{" "}
          <Link href="/signup?role=candidate" className="underline underline-offset-[3px] text-apricot">Sign up</Link> to apply or message a recruiter directly.
        </p>
        <ActiveFilterChips glass chips={chips} basePath="/jobs" currentParams={filters as Record<string, string | undefined>} />

        <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_290px] gap-7 items-start mt-5">
          <div className="flex flex-col gap-3.5 order-2 md:order-1">
            {jobs.map((job) => (
              <Reveal key={job.id}>
                <JobCard glass job={job} applied={false} href={`/jobs/${job.id}`} />
              </Reveal>
            ))}
            {jobs.length === 0 && (
              <p className="text-sm text-center py-10 text-paper/60">No roles match — try loosening a filter.</p>
            )}
          </div>

          <FilterPanel activeCount={chips.length}>
            {/* key = current filters: when a chip is removed the form remounts, so the
                dropdowns/tags/salary always match the results shown (previously they went stale). */}
            <form key={JSON.stringify(filters)} method="get">
              <div className="aur-bezel">
                <div className="aur-bezel-inner p-5 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[.04em] uppercase text-paper/75">
                    <SlidersHorizontal size={15} strokeWidth={1.25} /> Filters
                  </div>
                  <div>
                    <label className="aur-label">Position</label>
                    <MultiSelectFilter glass name="position" options={jobTitleOptions} initial={filters.position ? filters.position.split(",") : []} placeholder="Type to search…" />
                  </div>
                  <div>
                    <label className="aur-label">Company</label>
                    <MultiSelectFilter glass name="company" options={companyNameOptions} initial={filters.company ? filters.company.split(",") : []} placeholder="Type to search…" />
                  </div>
                  <div>
                    <label className="aur-label">Category</label>
                    <select name="category" defaultValue={filters.category || ""} className="aur-field aur-field-sm">
                      <option value="">Any</option>
                      <option>Tech</option>
                      <option>Non-tech</option>
                    </select>
                  </div>
                  <div>
                    <label className="aur-label">Employment type</label>
                    <select name="employmentType" defaultValue={filters.employmentType || ""} className="aur-field aur-field-sm">
                      <option value="">Any</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="aur-label">Experience level</label>
                    <select name="experienceLevel" defaultValue={filters.experienceLevel || ""} className="aur-field aur-field-sm">
                      <option value="">Any</option>
                      <option>Junior</option>
                      <option>Mid</option>
                      <option>Senior</option>
                      <option>Lead</option>
                    </select>
                  </div>
                  <div>
                    <label className="aur-label">Remote / on-site</label>
                    <select name="remote" defaultValue={filters.remote || ""} className="aur-field aur-field-sm">
                      <option value="">Any</option>
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="aur-label">Location</label>
                    <select name="location" defaultValue={filters.location || ""} className="aur-field aur-field-sm">
                      <option value="">Any</option>
                      {ARMENIAN_LOCATIONS.map((loc) => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="aur-label">Language</label>
                    <select name="language" defaultValue={filters.language || ""} className="aur-field aur-field-sm">
                      <option value="">Any</option>
                      {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="aur-label">Salary ($/mo)</label>
                    <div className="mt-1">
                      <SalaryRangeFilter glass minName="salaryMin" maxName="salaryMax" defaultMin={filters.salaryMin} defaultMax={filters.salaryMax} />
                    </div>
                  </div>
                  <button type="submit" className="aur-btn aur-btn-primary justify-center mt-1 !pl-6 !pr-2">
                    Apply filters
                    <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                  </button>
                </div>
              </div>
            </form>
          </FilterPanel>
        </div>
      </div>
    </GuestPage>
  );
}
