import { getSession } from "@/lib/auth";
import { listApplicationsForJob, parseSkills, archiveJob, restoreArchivedJob } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import sql from "@/lib/db";
import { Job } from "@/lib/queries";
import { Ledger, Tag, LanguageTags } from "@/components/ui";
import JobApplicantsView from "@/components/JobApplicantsView";
import FormattedMessage from "@/components/FormattedMessage";

async function archiveJobAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const jobId = Number(formData.get("jobId"));
  await archiveJob(jobId, session.userId);
  revalidatePath(`/company/jobs/${jobId}`);
  revalidatePath("/company/dashboard");
}

async function restoreJobAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const jobId = Number(formData.get("jobId"));
  await restoreArchivedJob(jobId, session.userId);
  revalidatePath(`/company/jobs/${jobId}`);
  revalidatePath("/company/dashboard");
}

export default async function JobPositionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const { id } = await params;
  const jobId = Number(id);
  const rows = (await sql`
    SELECT * FROM jobs WHERE id = ${jobId} AND company_user_id = ${session.userId}
  `) as Job[];
  const job = rows[0];

  if (!job) {
    return <div className="px-6 py-10 max-w-2xl mx-auto text-sm text-muted">Role not found.</div>;
  }

  const applicants = await listApplicationsForJob(jobId, session.userId);
  const languages = parseSkills(job.languages || "[]");

  let daysUntilPermanentDelete: number | null = null;
  if (job.archived_at) {
    const archivedDate = new Date(job.archived_at.replace(" ", "T"));
    const daysSince = Math.floor((Date.now() - archivedDate.getTime()) / (1000 * 60 * 60 * 24));
    daysUntilPermanentDelete = Math.max(0, 90 - daysSince);
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <Link href="/company/dashboard" className="text-sm text-muted">← Back to your roles</Link>

      <div className="flex items-start justify-between mt-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-semibold text-2xl">{job.title}</h1>
            {job.archived_at ? (
              <Tag>Archived</Tag>
            ) : !job.active ? (
              <Tag>Paused</Tag>
            ) : null}
          </div>
          <p className="text-sm text-muted mt-1">
            {job.category} · {job.employment_type} · {job.location}
            {job.experience_level && ` · ${job.experience_level}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!job.archived_at && (
            <Link href={`/company/jobs/${job.id}/edit`} className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper whitespace-nowrap">
              Edit role
            </Link>
          )}
        </div>
      </div>

      {job.archived_at && (
        <div className="mt-4 p-4 rounded-lg bg-paper-dim">
          <p className="text-sm font-medium">This role is archived</p>
          <p className="text-xs text-muted mt-1">
            Nothing is deleted yet — you can restore it any time in the next {daysUntilPermanentDelete} day
            {daysUntilPermanentDelete === 1 ? "" : "s"}. After that, this role and every conversation tied to
            it are permanently deleted and can&apos;t be recovered.
          </p>
          <form action={restoreJobAction} className="mt-3">
            <input type="hidden" name="jobId" value={job.id} />
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-apricot text-ink">
              Restore this role
            </button>
          </form>
        </div>
      )}

      <div className="mt-4">
        <Ledger min={job.salary_min} max={job.salary_max} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {parseSkills(job.skills).map((s) => <Tag key={s}>{s}</Tag>)}
        {!!job.remote && <Tag tone="moss">Remote</Tag>}
      </div>
      {languages.length > 0 && <div className="mt-3"><LanguageTags languages={languages} /></div>}

      <div className="mt-8">
        <JobApplicantsView
          applicants={applicants}
          description={
            <div>
              <p className="text-xs font-medium text-muted mb-2">Description</p>
              <div className="text-sm leading-relaxed"><FormattedMessage body={job.description} /></div>
            </div>
          }
        />
      </div>

      {!job.archived_at && (
        <div className="mt-10 p-4 rounded-lg border border-line">
          <p className="text-sm font-medium">Archive this role</p>
          <p className="text-xs text-muted mt-1 mb-3">
            Use this once the role is permanently closed — someone was hired and passed
            probation, you&apos;re no longer hiring for it, etc. Archiving is different from
            pausing: it hides the role and every conversation tied to it, but nothing is
            deleted for 3 months, so you can still restore it if needed.
          </p>
          <form action={archiveJobAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium border border-line">
              Archive this role
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
