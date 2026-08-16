import { getJobWithCompany, parseSkills, createApplication, sendMessage, getCandidateProfile, findApplication } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import { Ledger, Tag } from "@/components/ui";
import { put } from "@vercel/blob";
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
        {job.experience_level && <Tag>{job.experience_level}</Tag>}
        {!!job.remote && <Tag tone="moss">Remote</Tag>}
        {parseSkills(job.skills).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>
      {languages.length > 0 && (
        <p className="text-sm text-muted mt-3">Languages needed: {languages.join(", ")}</p>
      )}

      {existing ? (
        <div className="mt-8 p-5 rounded-xl border border-line bg-white">
          <p className="text-sm font-medium mb-3">✓ You&apos;ve already applied to this role.</p>
          <Link
            href={`/thread/${existing.id}`}
            className="inline-block px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink"
          >
            Go to conversation
          </Link>
        </div>
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
    <form action={action} encType="multipart/form-data" className="mt-8 p-5 rounded-xl border border-line bg-white">
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
      <input name="cv" type="file" accept="application/pdf" className="file-input w-full mt-2 text-sm" />

      <button type="submit" className="mt-4 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink">
        Apply & message {job!.company_name}
      </button>
    </form>
  );
}
