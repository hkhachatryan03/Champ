import Link from "next/link";
import { getJobWithCompany, parseSkills } from "@/lib/queries";
import { formatPostedAge } from "@/lib/dates";
import FormattedMessage from "@/components/FormattedMessage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getJobLockReason, LOCK_BANNER_TEXT } from "@/lib/jobLock";
import { LANGUAGE_LEVELS } from "@/lib/constants";
import GuestPage from "@/components/GuestPage";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
    return (
      <GuestPage>
        <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-2xl mx-auto">
          <div className="aur-bezel">
            <div className="aur-bezel-inner p-7 text-sm text-paper/60">This role no longer exists.</div>
          </div>
        </div>
      </GuestPage>
    );
  }

  const languages = parseSkills(job.languages || "[]");
  const lockReason = getJobLockReason(job);

  const skills = parseSkills(job.skills);

  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+1.75rem)] pb-24 max-w-5xl mx-auto">
        <Link
          href="/jobs"
          className="aur-hero-in inline-flex items-center gap-2 text-[13.5px] text-paper/60 hover:text-paper hover:-translate-x-[3px] transition-[color,transform] duration-300 mb-6"
        >
          <ArrowLeft size={16} strokeWidth={1.25} /> Back to open roles
        </Link>

        <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-7 md:items-start">
          {/* Left column (flattened on phones so the order reads: title, salary, tags, sign-up, details) */}
          <div className="contents md:flex md:flex-col md:gap-[18px] md:min-w-0">
            <header className="order-1 aur-hero-in flex items-start gap-[18px]" style={{ animationDelay: ".05s" }}>
              <div className="w-[60px] h-[60px] rounded-[18px] bg-ink/70 border border-paper/15 shadow-[inset_0_1px_1px_rgba(250,246,238,.12)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {job.company_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.company_avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-semibold text-[26px] text-apricot">
                    {job.company_name?.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-semibold text-[clamp(28px,4vw,38px)] leading-[1.1] text-paper">{job.title}</h1>
                <p className="text-sm text-paper/60 mt-2">
                  <Link href={`/companies/${job.company_user_id}`} className="underline underline-offset-[3px] text-paper hover:text-apricot transition-colors">{job.company_name}</Link> · {job.location}
                  {!!job.remote && " · Remote"} · Posted {formatPostedAge(job.created_at)}
                </p>
              </div>
            </header>

            <div className="order-2 aur-hero-in" style={{ animationDelay: ".12s" }}>
              <div className="aur-bezel">
                <div className="aur-bezel-inner px-6 py-5 md:px-[26px] flex flex-col gap-2">
                  <span className="text-xs font-medium tracking-[.12em] uppercase text-paper/50">Salary range</span>
                  <div className="flex items-baseline gap-3.5 font-mono-num font-medium text-[clamp(24px,4vw,32px)] text-apricot">
                    <span>${job.salary_min}</span>
                    <span className="flex-1 border-b border-dotted border-paper/30 min-w-5 -translate-y-1.5" />
                    <span>${job.salary_max}</span>
                    <span className="text-sm text-paper/50">/mo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-3 aur-hero-in flex flex-wrap gap-2" style={{ animationDelay: ".18s" }}>
              <span className="aur-tag !px-3.5 !py-1.5 !text-[13px]">{job.employment_type}</span>
              {job.experience_level && <span className="aur-tag !px-3.5 !py-1.5 !text-[13px]">{job.experience_level}</span>}
            </div>

            {lockReason && (
              <div className="order-4 aur-hero-in p-4 rounded-[18px] bg-apricot/10 border border-apricot/30">
                <p className="text-sm font-semibold text-apricot">{LOCK_BANNER_TEXT[lockReason].title}</p>
                <p className="text-[12.5px] leading-[1.6] text-paper/60 mt-1">{LOCK_BANNER_TEXT[lockReason].body}</p>
              </div>
            )}

            <div className="order-6 aur-hero-in" style={{ animationDelay: ".24s" }}>
              <div className="aur-bezel">
                <div className="aur-bezel-inner p-6 md:p-[30px]">
                  <p className="aur-kicker">About the role</p>
                  <div className="mt-3.5 text-[15.5px] leading-[1.8] text-paper/75 [&_strong]:text-paper [&_b]:text-paper [&_li::marker]:text-apricot [&_a]:text-apricot [&_a]:underline">
                    <FormattedMessage body={job.description} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="contents md:flex md:flex-col md:gap-3.5 md:sticky md:top-[92px]">
            <div className="order-5 aur-hero-in" style={{ animationDelay: ".2s" }}>
              <div className="aur-bezel">
                <div className="aur-bezel-inner p-6">
                  <p className="text-[15px] leading-[1.6] text-paper">
                    Sign up to apply and message <span className="font-semibold text-apricot">{job.company_name}</span> directly.
                  </p>
                  <div className="mt-[18px] flex flex-col items-start gap-1.5">
                    <Link href="/signup?role=candidate" className="aur-btn aur-btn-primary aur-btn-shine">
                      Sign up to apply
                      <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                    </Link>
                    <Link href="/login" className="aur-btn aur-btn-ghost">
                      Log in
                      <span className="aur-ring"><ArrowRight size={14} /></span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="order-7 aur-hero-in" style={{ animationDelay: ".28s" }}>
                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner p-5">
                    <p className="aur-kicker">Skills</p>
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="text-[13px] font-medium px-3 py-1.5 rounded-xl bg-paper/[.06] border border-paper/10 text-paper/85 hover:border-apricot/60 hover:bg-apricot/10 transition-colors duration-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="order-8 aur-hero-in" style={{ animationDelay: ".34s" }}>
                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner p-5">
                    <p className="aur-kicker">Languages needed</p>
                    <div className="mt-3.5 flex flex-col gap-3.5">
                      {languages.map((entry) => {
                        const [lang, level] = entry.split(":");
                        const levelIndex = LANGUAGE_LEVELS.indexOf(level);
                        return (
                          <div key={entry} className="flex items-center justify-between gap-3">
                            <span className="text-[13.5px] font-medium text-paper">{lang}</span>
                            <div className="flex items-center gap-2.5">
                              <div className="aur-lv">
                                {LANGUAGE_LEVELS.map((_, i) => (
                                  <i key={i} className={i <= levelIndex ? "f" : ""} />
                                ))}
                              </div>
                              {level && <span className="text-xs text-paper/50 w-11 text-right">{level}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GuestPage>
  );
}
