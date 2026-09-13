import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listActiveJobsWithCompany, parseSkills, getAppliedJobIds } from "@/lib/queries";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import JobCard from "@/components/JobCard";

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
          <JobCard key={job.id} job={job} applied={appliedIds.has(job.id)} />
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-center py-10 text-muted">Nothing matches your profile yet — check &quot;All roles&quot; instead.</p>
        )}
      </div>
    </div>
  );
}
