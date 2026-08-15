import Link from "next/link";
import { listActiveJobsWithCompany, parseSkills, JobFilters, getAppliedJobIds } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import { Ledger, Tag } from "@/components/ui";

export default async function BrowseJobsPage({
  searchParams,
}: {
  searchParams: Promise<JobFilters>;
}) {
  const filters = await searchParams;
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await requireOnboardedCandidate(session.userId);
  const jobs = await listActiveJobsWithCompany(filters);
  const appliedIds = await getAppliedJobIds(session.userId);

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <h1 className="font-display font-semibold text-2xl">All roles</h1>
      <p className="text-sm text-muted mt-1 mb-4">{jobs.length} roles match your filters</p>

      <form className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-xl mb-6 bg-paper-dim" method="get">
        <input name="position" defaultValue={filters.position} placeholder="Position" className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white" />
        <input name="company" defaultValue={filters.company} placeholder="Company" className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white" />
        <select name="category" defaultValue={filters.category || ""} className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
          <option value="">Category — any</option>
          <option>Tech</option>
          <option>Non-tech</option>
        </select>
        <select name="employmentType" defaultValue={filters.employmentType || ""} className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
          <option value="">Employment — any</option>
          <option>Full-time</option>
          <option>Part-time</option>
        </select>
        <select name="remote" defaultValue={filters.remote || ""} className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white">
          <option value="">Remote / on-site — any</option>
          <option value="remote">Remote</option>
          <option value="onsite">On-site</option>
        </select>
        <input name="location" defaultValue={filters.location} placeholder="Location" className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white" />
        <input name="salaryMin" defaultValue={filters.salaryMin} type="number" placeholder="Min salary $" className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white font-mono-num" />
        <input name="salaryMax" defaultValue={filters.salaryMax} type="number" placeholder="Max salary $" className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white font-mono-num" />
        <button type="submit" className="col-span-2 md:col-span-4 mt-1 px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper">
          Apply filters
        </button>
      </form>

      <div className="flex flex-col gap-3">
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
              <span className="text-xs text-muted whitespace-nowrap">{job.created_at}</span>
            </div>
            <div className="mt-4">
              <Ledger min={job.salary_min} max={job.salary_max} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag tone="moss">{job.category}</Tag>
              <Tag>{job.employment_type}</Tag>
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
    </div>
  );
}
