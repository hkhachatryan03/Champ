import { getSession } from "@/lib/auth";
import { listApplicationsForJob, parseSkills } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import sql from "@/lib/db";
import { Job } from "@/lib/queries";
import { Ledger, Tag, LanguageTags } from "@/components/ui";
import JobApplicantsView from "@/components/JobApplicantsView";

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

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <Link href="/company/dashboard" className="text-sm text-muted">← Back to your roles</Link>

      <div className="flex items-start justify-between mt-4">
        <div>
          <h1 className="font-display font-semibold text-2xl">{job.title}</h1>
          <p className="text-sm text-muted mt-1">
            {job.category} · {job.employment_type} · {job.location}
            {job.experience_level && ` · ${job.experience_level}`}
          </p>
        </div>
        <Link href={`/company/jobs/${job.id}/edit`} className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper whitespace-nowrap">
          Edit role
        </Link>
      </div>

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
              <p className="text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
