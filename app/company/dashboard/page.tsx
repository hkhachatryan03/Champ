import { getSession } from "@/lib/auth";
import { listJobsForCompany, listActiveCandidatePool, parseSkills } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ledger, Tag } from "@/components/ui";

export default async function CompanyDashboard() {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const jobs = await listJobsForCompany(session.userId);
  const pool = await listActiveCandidatePool();

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

      <h2 className="font-display font-semibold text-lg mt-10 mb-3">Candidates who are actively looking</h2>
      <div className="flex flex-col gap-3">
        {pool.slice(0, 10).map((c) => (
          <Link
            key={c.user_id}
            href={`/company/candidates/${c.user_id}`}
            className="p-4 rounded-xl border border-line bg-white flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium">{c.name || "(unnamed candidate)"}</div>
              <div className="text-xs text-muted mt-0.5">{c.title} · {c.years_experience} yrs</div>
              <div className="flex gap-1.5 mt-1.5">{parseSkills(c.skills).map((s) => <Tag key={s}>{s}</Tag>)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">wants</div>
              <div className="font-mono-num text-sm text-apricot-deep">${c.salary_min}–{c.salary_max}</div>
            </div>
          </Link>
        ))}
        {pool.length === 0 && <p className="text-sm text-muted">No active candidates yet.</p>}
      </div>
      <p className="text-xs text-muted mt-3">
        Click a candidate to see their full profile and invite them to one of your roles directly.
      </p>
    </div>
  );
}
