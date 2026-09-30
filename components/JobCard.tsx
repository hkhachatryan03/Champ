import Link from "next/link";
import { Ledger, Tag } from "@/components/ui";
import { formatPostedAge } from "@/lib/dates";
import { parseSkills } from "@/lib/queries";

type JobCardData = {
  id: number;
  title: string;
  company_name: string;
  company_avatar_url?: string | null;
  location: string;
  remote: number;
  employment_type: string;
  category: string;
  experience_level: string | null;
  salary_min: number;
  salary_max: number;
  skills: string;
  created_at: string;
  client_name?: string;
};

export default function JobCard({
  job,
  applied,
  href,
  glass = false,
}: {
  job: JobCardData;
  applied: boolean;
  href?: string;
  /** Dark "Ethereal Glass" look used on the public guest pages. Default = original light card. */
  glass?: boolean;
}) {
  const skills = parseSkills(job.skills);
  const visibleSkills = skills.slice(0, 4);
  const extraSkillCount = skills.length - visibleSkills.length;

  if (glass) {
    return (
      <Link href={href || `/candidate/jobs/${job.id}`} className="group block">
        <div className="aur-bezel-sm transition-[transform,border-color] duration-500 ease-[cubic-bezier(.32,.72,0,1)] group-hover:-translate-y-[3px] group-hover:border-apricot/35">
          <div className="aur-bezel-inner p-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-[14px] bg-ink/70 border border-paper/15 flex items-center justify-center flex-shrink-0 font-display font-semibold text-apricot text-lg overflow-hidden">
                {job.company_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.company_avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  job.company_name?.charAt(0).toUpperCase() || "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-display font-semibold text-lg text-paper truncate group-hover:text-apricot transition-colors duration-300">
                      {job.title}
                    </h3>
                    {applied && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-apricot/15 text-apricot whitespace-nowrap flex-shrink-0">
                        ✓ Applied
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-paper/45 whitespace-nowrap flex-shrink-0">{formatPostedAge(job.created_at)}</span>
                </div>
                <p className="text-[13.5px] text-paper/60 mt-0.5">
                  {job.company_name} · {job.location}
                  {!!job.remote && " · Remote"} · {job.employment_type}
                </p>
                {job.client_name && (
                  <p className="text-xs text-paper/45 mt-0.5">Hiring on behalf of {job.client_name}</p>
                )}
                {job.experience_level && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="aur-tag">{job.experience_level}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="aur-sal sm:min-w-[210px]">
                <span>${job.salary_min}</span>
                <span className="aur-dots" />
                <span>${job.salary_max}</span>
                <small>/mo</small>
              </div>
              {visibleSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {visibleSkills.map((s) => (
                    <span key={s} className="aur-tag">{s}</span>
                  ))}
                  {extraSkillCount > 0 && <span className="aur-tag">+{extraSkillCount} more</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href || `/candidate/jobs/${job.id}`}
      className="group block p-5 rounded-2xl border border-line bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-paper-dim flex items-center justify-center flex-shrink-0 font-display font-semibold text-apricot-deep text-lg overflow-hidden">
          {job.company_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company_avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            job.company_name?.charAt(0).toUpperCase() || "?"
          )}
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
          {job.client_name && (
            <p className="text-xs text-muted mt-0.5">Hiring on behalf of {job.client_name}</p>
          )}
          {job.experience_level && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tag>{job.experience_level}</Tag>
            </div>
          )}
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
