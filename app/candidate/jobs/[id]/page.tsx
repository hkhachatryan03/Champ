import { getJobWithCompany, parseSkills, createApplication, sendMessage, getCandidateProfile, findApplication } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import { Ledger, Tag } from "@/components/ui";
import Link from "next/link";

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

  const profile = await getCandidateProfile(session.userId);
  const applicationId = await createApplication(jobId, session.userId, note, profile.cv_filename, expectedSalary);

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

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <Link href="/candidate/jobs" className="text-sm text-muted">← Back to roles</Link>
      <div className="flex items-center gap-2 mt-4">
        <h1 className="font-display font-semibold text-3xl">{job.title}</h1>
      </div>
      <p className="text-sm text-muted mt-1">
        {job.company_name} · {job.location} · {job.created_at}
      </p>
      <div className="mt-6 p-4 rounded-lg bg-paper-dim">
        <Ledger min={job.salary_min} max={job.salary_max} />
      </div>
      <p className="mt-6 text-base leading-relaxed">{job.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Tag tone="moss">{job.category}</Tag>
        <Tag>{job.employment_type}</Tag>
        {!!job.remote && <Tag tone="moss">Remote</Tag>}
        {parseSkills(job.skills).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>

      <ApplyBlock job={job} action={applyAction} />
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
    <form action={action} className="mt-8 p-5 rounded-xl border border-line bg-white">
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

      <p className="text-xs text-muted mt-3">
        {profile?.cv_filename
          ? `Your CV on file (${profile.cv_filename}) will be attached automatically.`
          : "No CV on file yet — you can still apply, or add one from \"My profile\" first so the company can see it."}
      </p>
      <button type="submit" className="mt-3 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink">
        Apply & message {job!.company_name}
      </button>
    </form>
  );
}
