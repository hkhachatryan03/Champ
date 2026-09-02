import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listActiveJobsWithCompany, parseSkills, getAppliedJobIds } from "@/lib/queries";
import { requireOnboardedCandidate } from "@/lib/guards";
import { Ledger, Tag } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function ForYouPage() {
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");

  const profile = await requireOnboardedCandidate(session.userId);
  const preferredPositions = parseSkills(profile.preferred_positions || "[]");
  const appliedIds = await getAppliedJobIds(session.userId);

  const allJobs = await listActiveJobsWithCompany();
  const jobs = allJobs.filter((j) => {
    const matchesPosition = preferredPositions.some((p) => j.title.toLowerCase().includes(p.toLowerCase()));
    const salaryOverlap = j.salary_max >= profile.salary_min && j.salary_min <= profile.salary_max;
    return matchesPosition && salaryOverlap;
  });

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <h1 className="font-display font-semibold text-2xl">For you</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        {preferredPositions.length > 0
          ? `Matched to roles like ${preferredPositions.join(", ")}, in your $${profile.salary_min}–${profile.salary_max} range.`
          : (
            <>
              Add the positions you&apos;re looking for on{" "}
              <Link href="/candidate/profile" className="underline">your profile</Link> to see matches here.
            </>
          )}
      </p>
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/candidate/jobs/${job.id}`} className="block p-5 rounded-xl border border-line bg-white hover:shadow-sm transition">
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
              {!!job.remote && " · Remote"} · {job.employment_type}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Tag tone="moss">{job.category}</Tag>
              {job.experience_level && <Tag>{job.experience_level}</Tag>}
            </div>
            <div className="mt-4"><Ledger min={job.salary_min} max={job.salary_max} /></div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {parseSkills(job.skills).map((t) => <Tag key={t}>{t}</Tag>)}
            </div>
          </Link>
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-center py-10 text-muted">Nothing matches your profile yet — check &quot;All roles&quot; instead.</p>
        )}
      </div>
    </div>
  );
}
