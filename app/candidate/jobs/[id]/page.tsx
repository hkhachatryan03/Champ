import { getJobWithCompany, parseSkills, createApplication, sendMessage, getCandidateProfile, getCandidateCompletionStatus, findApplication } from "@/lib/queries";
import { formatPostedAge } from "@/lib/dates";
import { getSession } from "@/lib/auth";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui";
import { put } from "@vercel/blob";
import Link from "next/link";
import ClearableFileInput from "@/components/ClearableFileInput";
import FormattedMessage from "@/components/FormattedMessage";
import { getJobLockReason, LOCK_BANNER_TEXT } from "@/lib/jobLock";
import { LANGUAGE_LEVELS } from "@/lib/constants";
import GuestPage from "@/components/GuestPage";
import { ArrowLeft, ArrowRight } from "lucide-react";

async function applyAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");

  const jobId = Number(formData.get("jobId"));
  const note = String(formData.get("note") || "");
  const expectedSalaryRaw = String(formData.get("expectedSalary") || "").trim();
  const expectedSalary = expectedSalaryRaw ? Number(expectedSalaryRaw) : null;

  const existing = await findApplication(jobId, session.userId);
  if (existing) {
    redirect(`/thread/${existing.id}`);
  }

  const completion = await getCandidateCompletionStatus(session.userId);
  if (!completion.complete) {
    redirect(`/candidate/jobs/${jobId}?error=incomplete_profile`);
  }

  const job = await getJobWithCompany(jobId);
  if (!job || getJobLockReason(job)) {
    redirect(`/candidate/jobs/${jobId}`);
  }

  const profile = await getCandidateProfile(session.userId);

  // A CV attached just for this application takes priority over the
  // profile's default CV — but neither is required to apply.
  let cvFilename = profile.cv_filename;
  const cvFile = formData.get("cv") as File | null;
  if (cvFile && cvFile.size > 0) {
    try {
      const buffer = Buffer.from(await cvFile.arrayBuffer());
      const safeName = `cv/${session.userId}_${Date.now()}_${cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const blob = await put(safeName, buffer, { access: "public", contentType: "application/pdf" });
      cvFilename = blob.url;
    } catch (err) {
      console.error("Blob upload failed during apply:", err);
      // Don't block the application over a failed CV upload — just fall
      // back to whatever CV (if any) is already on the profile.
    }
  }

  const applicationId = await createApplication(jobId, session.userId, note, cvFilename, expectedSalary);

  // Just the candidate's own note — the CV and rate are already shown in
  // the summary strip at the top of the thread, so repeating them in the
  // message text would just be clutter.
  if (note.trim()) {
    await sendMessage(applicationId, "candidate", note);
  }
  redirect(`/thread/${applicationId}`);
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await requireOnboardedCandidate(session.userId);

  const { id } = await params;
  const { error } = await searchParams;
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

  const existing = await findApplication(job.id, session.userId);
  const languages = parseSkills(job.languages || "[]");
  const skills = parseSkills(job.skills);
  const lockReason = getJobLockReason(job);

  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+1.75rem)] pb-24 max-w-5xl mx-auto">
        <Link
          href="/candidate/jobs"
          className="aur-hero-in inline-flex items-center gap-2 text-[13.5px] text-paper/60 hover:text-paper hover:-translate-x-[3px] transition-[color,transform] duration-300 mb-6"
        >
          <ArrowLeft size={16} strokeWidth={1.25} /> Back to roles
        </Link>

        {error === "incomplete_profile" && (
          <div className="aur-alert mb-5 !text-sm !leading-[1.55] !px-4 !py-3 !rounded-2xl">
            Finish your profile (name, location, a skill, and at least one work experience or education entry) before applying.{" "}
            <Link href="/candidate/profile" className="underline underline-offset-[3px] text-apricot">Go to my profile →</Link>
          </div>
        )}

        <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-7 md:items-start">
          {/* Left column (flattened on phones so the order reads: title, salary, tags, apply, details) */}
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
          <div className="contents md:flex md:flex-col md:gap-3.5 md:sticky md:top-[96px]">
            <div className="order-5 aur-hero-in" style={{ animationDelay: ".2s" }}>
              {existing ? (
                <div className="aur-bezel">
                  <div className="aur-bezel-inner p-[22px]">
                    <p className="text-[15px] font-medium text-paper">✓ You&apos;ve already applied to this role.</p>
                    <div className="mt-2 mb-4"><StatusPill glass status={existing.status} /></div>
                    <Link href={`/thread/${existing.id}`} className="aur-btn aur-btn-primary">
                      Go to conversation
                      <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                    </Link>
                  </div>
                </div>
              ) : lockReason ? (
                <div className="aur-bezel">
                  <div className="aur-bezel-inner p-5 text-sm text-paper/62 leading-[1.6]">This role isn&apos;t accepting new applications right now.</div>
                </div>
              ) : (
                <ApplyBlock job={job} action={applyAction} />
              )}
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

async function ApplyBlock({
  job,
  action,
}: {
  job: Awaited<ReturnType<typeof getJobWithCompany>>;
  action: (formData: FormData) => void;
}) {
  const session = await getSession();
  const profile = session && session.role === "candidate" ? await getCandidateProfile(session.userId) : null;

  return (
    <div className="aur-bezel">
      <form action={action} encType="multipart/form-data" className="aur-bezel-inner p-[22px] flex flex-col gap-3.5">
        <p className="aur-kicker">Apply</p>
        <input type="hidden" name="jobId" value={job!.id} />
        <div>
          <label className="aur-label">Say why you&apos;re a fit (2-3 sentences)</label>
          <textarea name="note" rows={3} required className="aur-field" />
        </div>
        <div>
          <label className="aur-label">Your rate for this role ($/mo, optional)</label>
          <input
            name="expectedSalary"
            type="number"
            placeholder={`e.g. ${job!.salary_min}–${job!.salary_max}`}
            className="aur-field font-mono-num"
          />
        </div>
        <div>
          <label className="aur-label">Attach a CV for this application (optional)</label>
          {profile?.cv_filename ? (
            <p className="text-xs leading-[1.55] text-paper/50 mb-2.5">
              Your CV on file will be used automatically — pick a different one here only if you
              want to use something else just for this application.
            </p>
          ) : (
            <p className="text-xs leading-[1.55] text-paper/50 mb-2.5">
              No CV on your profile yet — attach one here if you&apos;d like, or apply without one.
            </p>
          )}
          <ClearableFileInput glass name="cv" />
        </div>
        <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine justify-center w-full !py-3.5 !pl-5 !pr-2 mt-1">
          Apply &amp; message {job!.company_name}
          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
        </button>
      </form>
    </div>
  );
}
