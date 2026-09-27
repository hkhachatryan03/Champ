import Link from "next/link";
import { getJobWithCompany, parseSkills } from "@/lib/queries";
import { formatPostedAge } from "@/lib/dates";
import { Ledger, Tag } from "@/components/ui";
import FormattedMessage from "@/components/FormattedMessage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getJobLockReason, LOCK_BANNER_TEXT } from "@/lib/jobLock";
import { LANGUAGE_LEVELS } from "@/lib/constants";

export default async function PublicJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  // If someone's actually logged in as a candidate and lands here (e.g. a
  // shared link), send them to the real version so applying works.
  if (session?.role === "candidate") {
    const { id } = await params;
    redirect(`/candidate/jobs/${id}`);
  }

  const { id } = await params;
  const job = await getJobWithCompany(Number(id));
  if (!job) {
    return <div className="px-6 py-10 max-w-2xl mx-auto text-sm text-muted">This role no longer exists.</div>;
  }

  const languages = parseSkills(job.languages || "[]");
  const lockReason = getJobLockReason(job);

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <Link href="/jobs" className="text-sm text-muted">← Back to open roles</Link>

      <div className="flex items-start gap-4 mt-4">
        <div className="w-14 h-14 rounded-2xl bg-paper-dim flex items-center justify-center flex-shrink-0 overflow-hidden">
          {job.company_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company_avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-semibold text-2xl text-apricot-deep">
              {job.company_name?.charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </div>
        <div>
          <h1 className="font-display font-semibold text-3xl leading-tight">{job.title}</h1>
          <p className="text-sm text-muted mt-1">
            <Link href={`/companies/${job.company_user_id}`} className="underline hover:text-ink">{job.company_name}</Link> · {job.location}
            {!!job.remote && " · Remote"} · Posted {formatPostedAge(job.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-apricot/10">
        <Ledger min={job.salary_min} max={job.salary_max} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Tag>{job.employment_type}</Tag>
        {job.experience_level && <Tag>{job.experience_level}</Tag>}
      </div>

      {parseSkills(job.skills).length > 0 && (
        <div className="mt-4 p-5 rounded-2xl border border-line bg-white">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Skills</p>
          <div className="flex flex-wrap gap-2">
            {parseSkills(job.skills).map((s) => (
              <span
                key={s}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-paper-dim border border-transparent hover:border-apricot-deep hover:bg-apricot/10 transition-colors"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {languages.length > 0 && (
        <div className="mt-4 p-5 rounded-2xl border border-line bg-white">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Languages needed</p>
          <div className="flex flex-col gap-3">
            {languages.map((entry) => {
              const [lang, level] = entry.split(":");
              const levelIndex = LANGUAGE_LEVELS.indexOf(level);
              return (
                <div key={entry} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{lang}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {LANGUAGE_LEVELS.map((_, i) => (
                        <span
                          key={i}
                          className={`w-4 h-1.5 rounded-full ${i <= levelIndex ? "bg-moss" : "bg-line"}`}
                        />
                      ))}
                    </div>
                    {level && <span className="text-xs text-muted w-12 text-right">{level}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 rounded-2xl border border-line bg-white">
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">About the role</p>
        <div className="text-base leading-relaxed"><FormattedMessage body={job.description} /></div>
      </div>

      {lockReason && (
        <div className="mt-6 p-4 rounded-2xl bg-apricot/10 border border-apricot/20">
          <p className="text-sm font-medium text-apricot-deep">{LOCK_BANNER_TEXT[lockReason].title}</p>
          <p className="text-xs text-muted mt-1">{LOCK_BANNER_TEXT[lockReason].body}</p>
        </div>
      )}

      <div className="mt-6 p-6 rounded-2xl border border-line bg-white">
        <p className="text-sm font-medium mb-3">Sign up to apply and message {job.company_name} directly.</p>
        <div className="flex gap-2">
          <Link href="/signup?role=candidate" className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink">
            Sign up to apply
          </Link>
          <Link href="/login" className="px-5 py-3 rounded-lg font-medium text-sm border border-line">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
