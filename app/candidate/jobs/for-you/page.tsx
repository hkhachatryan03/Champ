import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listActiveJobsWithCompany, parseSkills, getAppliedJobIds } from "@/lib/queries";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import JobCard from "@/components/JobCard";
import GuestPage from "@/components/GuestPage";
import Reveal from "@/components/Reveal";

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
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-3xl mx-auto">
        <h1 className="aur-hero-in font-display font-semibold text-[clamp(34px,5vw,44px)] leading-[1.1] text-paper">For you</h1>
        <p className="aur-hero-in text-[15px] leading-[1.7] text-paper/62 mt-3 mb-7 max-w-[620px]" style={{ animationDelay: ".1s" }}>
          {preferredPositions.length > 0 ? (
            <>
              Matched to roles like <span className="text-paper font-medium">{preferredPositions.join(", ")}</span>, in your{" "}
              <span className="font-mono-num text-apricot">${profile.salary_min}–{profile.salary_max}</span> range.
            </>
          ) : (
            <>
              Add the positions you&apos;re looking for on{" "}
              <Link href="/candidate/profile" className="underline underline-offset-[3px] text-apricot">your profile</Link> to see matches here.
            </>
          )}
        </p>
        <div className="flex flex-col gap-3.5">
          {jobs.map((job) => (
            <Reveal key={job.id}>
              <JobCard glass job={job} applied={appliedIds.has(job.id)} />
            </Reveal>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-center py-10 text-paper/60">Nothing matches your profile yet — check &quot;All roles&quot; instead.</p>
          )}
        </div>
      </div>
    </GuestPage>
  );
}
