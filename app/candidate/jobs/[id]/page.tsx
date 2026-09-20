import { getJobWithCompany, parseSkills, createApplication, sendMessage, getCandidateProfile, findApplication } from "@/lib/queries";
import { formatPostedAge } from "@/lib/dates";
import { getSession } from "@/lib/auth";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import { Ledger, Tag, StatusPill } from "@/components/ui";
import { put } from "@vercel/blob";
import Link from "next/link";
import ClearableFileInput from "@/components/ClearableFileInput";
import FormattedMessage from "@/components/FormattedMessage";
import { getJobLockReason, LOCK_BANNER_TEXT } from "@/lib/jobLock";
import { LANGUAGE_LEVELS } from "@/lib/constants";

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

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await requireOnboardedCandidate(session.userId);

  const { id } = await params;
  const job = await getJobWithCompany(Number(id));
  if (!job) {
    return <div className="px-6 py-10 max-w-2xl mx-auto text-sm text-muted">This role no longer exists.</div>;
  }

  const existing = await findApplication(job.id, session.userId);
  const languages = parseSkills(job.languages || "[]");

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <Link href="/candidate/jobs" className="text-sm text-muted">← Back to roles</Link>

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

      {(() => {
        const lockReason = getJobLockReason(job);
        if (!lockReason) return null;
        return (
          <div className="mt-6 p-4 rounded-2xl bg-apricot/10 border border-apricot/20">
            <p className="text-sm font-medium text-apricot-deep">{LOCK_BANNER_TEXT[lockReason].title}</p>
            <p className="text-xs text-muted mt-1">{LOCK_BANNER_TEXT[lockReason].body}</p>
          </div>
        );
      })()}

      {existing ? (
        <div className="mt-6 p-6 rounded-2xl border border-line bg-white">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-medium">✓ You&apos;ve already applied to this role.</p>
            <StatusPill status={existing.status} />
          </div>
          <Link
            href={`/thread/${existing.id}`}
            className="inline-block px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink"
          >
            Go to conversation
          </Link>
        </div>
      ) : getJobLockReason(job) ? (
        <p className="mt-6 text-sm text-muted">This role isn&apos;t accepting new applications right now.</p>
      ) : (
        <ApplyBlock job={job} action={applyAction} />
      )}
    </div>
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
    <form action={action} encType="multipart/form-data" className="mt-6 p-6 rounded-2xl border border-line bg-white">
      <input type="hidden" name="jobId" value={job!.id} />
      <label className="text-xs font-medium text-muted">Say why you&apos;re a fit (2-3 sentences)</label>
      <textarea name="note" rows={3} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />

      <label className="text-xs font-medium text-muted mt-4 block">
        Your rate for this role ($/mo, optional)
      </label>
      <input
        name="expectedSalary"
        type="number"
        placeholder={`e.g. ${job!.salary_min}–${job!.salary_max}`}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num"
      />

      <label className="text-xs font-medium text-muted mt-4 block">
        Attach a CV for this application (optional)
      </label>
      {profile?.cv_filename ? (
        <p className="text-xs text-muted mt-1">
          Your CV on file will be used automatically — pick a different one here only if you
          want to use something else just for this application.
        </p>
      ) : (
        <p className="text-xs text-muted mt-1">
          No CV on your profile yet — attach one here if you&apos;d like, or apply without one.
        </p>
      )}
      <ClearableFileInput name="cv" />

      <button type="submit" className="mt-4 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink">
        Apply & message {job!.company_name}
      </button>
    </form>
  );
}
