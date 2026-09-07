import { getSession } from "@/lib/auth";
import { listJobsForCompany } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ledger, Tag } from "@/components/ui";

export default async function CompanyDashboard() {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const allJobs = await listJobsForCompany(session.userId);
  const jobs = allJobs.filter((j) => !j.archived_at);
  const archivedJobs = allJobs.filter((j) => j.archived_at);

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="p-4 rounded-xl mb-6 flex items-start gap-3 bg-moss/10">
        <div>
          <p className="text-sm font-medium">Free for your first 3 months</p>
          <p className="text-xs text-muted mt-0.5">
            Post roles and message candidates at no cost. After that: no subscriptions —
            you only pay when you actually hire someone through Champ (20% of the hire&apos;s
            monthly salary).
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl">Your roles</h1>
        <Link href="/company/jobs/new" className="px-4 py-2 rounded-lg text-sm font-medium bg-apricot text-ink">
          + Post a role
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {jobs.map((j) => (
          <div
            key={j.id}
            className={`p-4 rounded-xl border border-line bg-white flex items-center justify-between ${j.active ? "" : "opacity-55"}`}
          >
            <Link href={`/company/jobs/${j.id}`} className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-base">{j.title}</span>
                {!j.active && <Tag>Paused</Tag>}
              </div>
              <div className="text-xs text-muted mt-0.5">
                {j.category} · {j.employment_type} · posted {j.created_at}
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Ledger min={j.salary_min} max={j.salary_max} />
              <Link href={`/company/jobs/${j.id}/edit`} className="text-xs underline text-muted whitespace-nowrap">
                Edit
              </Link>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-sm text-muted">You haven&apos;t posted a role yet.</p>}
      </div>

      {archivedJobs.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display font-semibold text-lg mb-3">Archived roles</h2>
          <div className="flex flex-col gap-2">
            {archivedJobs.map((j) => (
              <Link
                key={j.id}
                href={`/company/jobs/${j.id}`}
                className="p-3 rounded-lg border border-line bg-white flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity"
              >
                <span className="text-sm font-medium">{j.title}</span>
                <Tag>Archived</Tag>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 p-4 rounded-xl border border-line bg-white flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Looking for someone specific?</p>
          <p className="text-xs text-muted mt-0.5">Browse every candidate actively looking, with filters for position, location, experience, skills, and salary.</p>
        </div>
        <Link href="/company/candidates" className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper whitespace-nowrap">
          Open Candidates →
        </Link>
      </div>
    </div>
  );
}
