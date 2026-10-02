import { getSession } from "@/lib/auth";
import { listJobsForCompany } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import GuestPage from "@/components/GuestPage";
import Reveal from "@/components/Reveal";
import { ArrowRight, Gift } from "lucide-react";

export default async function CompanyDashboard() {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId, { allowPending: true });

  const allJobs = await listJobsForCompany(session.userId);
  const jobs = allJobs.filter((j) => !j.archived_at);
  const archivedJobs = allJobs.filter((j) => j.archived_at);

  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-[840px] mx-auto">
        <div className="aur-hero-in aur-bezel">
          <div className="aur-bezel-inner flex gap-3.5 items-start px-[22px] py-[18px]">
            <div className="aur-icon-chip flex-shrink-0"><Gift size={18} strokeWidth={1.25} /></div>
            <div>
              <p className="text-[15px] font-semibold text-paper">Free for your first 3 months</p>
              <p className="text-[13px] leading-[1.6] text-paper/60 mt-1">
                Post roles and message candidates at no cost. After that: no subscriptions —
                you only pay when you actually hire someone through Champ (20% of the hire&apos;s
                monthly salary).
              </p>
            </div>
          </div>
        </div>

        <div className="aur-hero-in flex items-center justify-between gap-4 flex-wrap mt-[30px]" style={{ animationDelay: ".08s" }}>
          <h1 className="font-display font-semibold text-[clamp(34px,5vw,44px)] leading-[1.1] text-paper">Your roles</h1>
          <Link href="/company/jobs/new" className="aur-btn aur-btn-primary aur-btn-shine !py-[11px] !pl-5 !pr-2">
            + Post a role
            <span className="aur-btn-icon"><ArrowRight size={14} /></span>
          </Link>
        </div>

        <div className="mt-[22px] flex flex-col gap-3">
          {jobs.map((j) => (
            <Reveal key={j.id}>
              <div className="aur-bezel-sm transition-[transform,border-color] duration-500 hover:-translate-y-0.5 hover:border-apricot/30">
                <div className={`aur-bezel-inner flex items-center justify-between gap-[18px] px-[22px] py-[18px] max-md:flex-col max-md:items-start ${j.active ? "" : "opacity-60"}`}>
                  <Link href={`/company/jobs/${j.id}`} className="group flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-display font-semibold text-[19px] text-paper group-hover:text-apricot transition-colors">{j.title}</span>
                      {!j.active && <span className="aur-tag">Paused</span>}
                    </div>
                    <div className="text-[12.5px] text-paper/55 mt-1">
                      {j.category} · {j.employment_type} · posted {j.created_at}
                    </div>
                  </Link>
                  <div className="flex items-center gap-4 flex-shrink-0 max-md:w-full max-md:justify-between">
                    <div className="aur-sal">
                      <span>${j.salary_min}</span>
                      <span className="aur-dots" />
                      <span>${j.salary_max}</span>
                      <small>/mo</small>
                    </div>
                    <Link href={`/company/jobs/${j.id}/edit`} className="text-[12.5px] underline underline-offset-[3px] text-paper/60 hover:text-apricot whitespace-nowrap transition-colors">
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
          {jobs.length === 0 && <p className="text-sm text-paper/55">You haven&apos;t posted a role yet.</p>}
        </div>

        {archivedJobs.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-[22px] mt-[42px] mb-3.5 text-paper">Archived roles</h2>
            <div className="flex flex-col gap-2">
              {archivedJobs.map((j) => (
                <Link key={j.id} href={`/company/jobs/${j.id}`} className="block opacity-75 hover:opacity-100 transition-opacity">
                  <div className="aur-bezel-sm">
                    <div className="aur-bezel-inner flex items-center justify-between px-[18px] py-[13px]">
                      <span className="text-[14.5px] font-medium text-paper">{j.title}</span>
                      <span className="aur-tag">Archived</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Reveal>
          <div className="aur-bezel mt-10">
            <div className="aur-bezel-inner flex items-center justify-between gap-[18px] flex-wrap px-6 py-5">
              <div>
                <p className="text-[15px] font-semibold text-paper">Looking for someone specific?</p>
                <p className="text-[12.5px] leading-[1.55] text-paper/55 mt-[3px] max-w-[480px]">Browse every candidate actively looking, with filters for position, location, experience, skills, and salary.</p>
              </div>
              <Link href="/company/candidates" className="aur-btn border border-paper/15 bg-paper/[.04] text-paper !text-[13.5px] hover:border-apricot hover:text-apricot">
                Open Candidates →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </GuestPage>
  );
}
