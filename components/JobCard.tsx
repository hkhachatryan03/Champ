import Link from "next/link";
import { Ledger, Tag } from "@/components/ui";
import { formatPostedAge } from "@/lib/dates";
import { parseSkills } from "@/lib/queries";

type JobCardData = {
  id: number;
  title: string;
  company_name: string;
  location: string;
  remote: number;
  employment_type: string;
  category: string;
  experience_level: string | null;
  salary_min: number;
  salary_max: number;
  skills: string;
  created_at: string;
};

export default function JobCard({ job, applied }: { job: JobCardData; applied: boolean }) {
  const skills = parseSkills(job.skills);
  const visibleSkills = skills.slice(0, 4);
  const extraSkillCount = skills.length - visibleSkills.length;

  return (
    <Link
      href={`/candidate/jobs/${job.id}`}
      className="group block p-5 rounded-2xl border border-line bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-paper-dim flex items-center justify-center flex-shrink-0 font-display font-semibold text-apricot-deep text-lg">
          {job.company_name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-display font-semibold text-lg truncate group-hover:text-apricot-deep transition-colors">
                {job.title}
              </h3>
              {applied && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-moss/15 text-moss whitespace-nowrap flex-shrink-0">
                  ✓ Applied
                </span>
              )}
            </div>
            <span className="text-xs text-muted whitespace-nowrap flex-shrink-0">{formatPostedAge(job.created_at)}</span>
          </div>
          <p className="text-sm text-muted mt-0.5">
            {job.company_name} · {job.location}
            {!!job.remote && " · Remote"} · {job.employment_type}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag tone="moss">{job.category}</Tag>
            {job.experience_level && <Tag>{job.experience_level}</Tag>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <div className="px-3 py-1.5 rounded-full bg-apricot/10 w-fit">
          <Ledger min={job.salary_min} max={job.salary_max} />
        </div>
        {visibleSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {visibleSkills.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
            {extraSkillCount > 0 && <Tag>+{extraSkillCount} more</Tag>}
          </div>
        )}
      </div>
    </Link>
  );
}
