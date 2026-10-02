import Link from "next/link";
import { listActiveCandidatePool, parseSkills, CandidateFilters, listDistinctCandidateTitles } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import { ARMENIAN_LOCATIONS, COMMON_SKILLS } from "@/lib/constants";
import SalaryRangeFilter from "@/components/SalaryRangeFilter";
import ActiveFilterChips, { FilterChip } from "@/components/ActiveFilterChips";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import GuestPage from "@/components/GuestPage";
import Reveal from "@/components/Reveal";
import FilterPanel from "@/components/FilterPanel";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

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
  const positionOptions = await listDistinctCandidateTitles();

  const locationLabel = ARMENIAN_LOCATIONS.find((l) => l.value === filters.location)?.label || filters.location;
  const chips: FilterChip[] = [];
  if (filters.position) {
    filters.position.split(",").filter(Boolean).forEach((p) => chips.push({ key: "position", label: p, removeValue: p }));
  }
  if (filters.location) chips.push({ key: "location", label: locationLabel! });
  if (filters.minExperience) chips.push({ key: "minExperience", label: `${filters.minExperience}+ yrs` });
  if (filters.skills) {
    filters.skills.split(",").filter(Boolean).forEach((s) => chips.push({ key: "skills", label: s, removeValue: s }));
  }
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
        <h1 className="aur-hero-in font-display font-semibold text-[clamp(34px,5vw,44px)] text-paper leading-[1.1]">Candidates</h1>
        <p className="aur-hero-in text-[15px] text-paper/60 mt-2.5" style={{ animationDelay: ".1s" }}>
          {candidates.length} candidates actively looking match your filters
        </p>
        <ActiveFilterChips glass chips={chips} basePath="/company/candidates" currentParams={filters as Record<string, string | undefined>} />

        <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_290px] gap-7 items-start mt-5">
          {/* Candidate list */}
          <div className="flex flex-col gap-3.5 order-2 md:order-1">
            {candidates.map((c) => {
              const langs: string[] = JSON.parse(c.languages || "[]");
              return (
                <Reveal key={c.user_id}>
                  <Link href={`/company/candidates/${c.user_id}`} className="group block">
                    <div className="aur-bezel-sm transition-[transform,border-color] duration-500 group-hover:-translate-y-0.5 group-hover:border-apricot/30">
                      <div className="aur-bezel-inner p-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-full bg-ink/70 border border-paper/15 flex items-center justify-center flex-shrink-0 overflow-hidden font-display font-semibold text-base text-apricot">
                            {c.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (c.name || "?").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-semibold text-lg text-paper group-hover:text-apricot transition-colors">{c.name || "(unnamed candidate)"}</div>
                            <p className="text-[13px] text-paper/58">
                              {c.title} · {c.years_experience} yrs {c.location && `· ${c.location}`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3.5 flex items-center gap-3 flex-wrap justify-between">
                          <div className="aur-sal">
                            <span>${c.salary_min}</span>
                            <span className="aur-dots" />
                            <span>${c.salary_max}</span>
                            <small>/mo</small>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {parseSkills(c.skills).map((s) => <span key={s} className="aur-tag">{s}</span>)}
                            {!!c.remote_ok && <span className="aur-tag aur-tag-ok">Remote OK</span>}
                          </div>
                        </div>
                        {langs.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {langs.map((entry) => {
                              const [lang, level] = entry.split(":");
                              return <span key={entry} className="aur-tag bg-paper/[.045]">{lang}{level ? ` · ${level}` : ""}</span>;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
            {candidates.length === 0 && (
              <p className="text-sm text-center py-10 text-paper/60">
                No candidates match — try loosening a filter.
              </p>
            )}
          </div>

          {/* Filters — stacked one under another, on the right */}
          <FilterPanel activeCount={chips.length}>
            {/* key = current filters: when a chip is removed the form remounts, so the
                inputs always match the results shown (previously they went stale). */}
            <form key={JSON.stringify(filters)} method="get">
              <div className="aur-bezel">
                <div className="aur-bezel-inner p-5 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[.04em] uppercase text-paper/75">
                    <SlidersHorizontal size={15} strokeWidth={1.25} /> Filters
                  </div>
                  <div>
                    <label className="aur-label">Position</label>
                    <MultiSelectFilter glass name="position" options={positionOptions} initial={filters.position ? filters.position.split(",") : []} placeholder="Type to search…" />
                  </div>
                  <div>
                    <label className="aur-label">Location</label>
                    <select name="location" defaultValue={filters.location || ""} className="aur-field aur-field-sm">
                      <option value="">Any</option>
                      {ARMENIAN_LOCATIONS.map((loc) => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="aur-label">Minimum experience (years)</label>
                    <input name="minExperience" type="number" min={0} defaultValue={filters.minExperience} placeholder="e.g. 3" className="aur-field aur-field-sm font-mono-num" />
                  </div>
                  <div>
                    <label className="aur-label">Skills</label>
                    <MultiSelectFilter glass name="skills" options={COMMON_SKILLS} initial={filters.skills ? filters.skills.split(",") : []} placeholder="Type to search…" />
                    <p className="text-xs leading-[1.55] text-paper/50 mt-1.5">Matches candidates who have all selected skills.</p>
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
