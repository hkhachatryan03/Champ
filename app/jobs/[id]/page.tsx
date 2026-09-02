import Link from "next/link";
import { getJobWithCompany, parseSkills } from "@/lib/queries";
import { formatPostedAge } from "@/lib/dates";
import { Ledger, Tag, LanguageTags } from "@/components/ui";
import FormattedMessage from "@/components/FormattedMessage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

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

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <Link href="/jobs" className="text-sm text-muted">← Back to open roles</Link>
      <h1 className="font-display font-semibold text-3xl mt-4">{job.title}</h1>
      <p className="text-sm text-muted mt-1">
        <Link href={`/companies/${job.company_user_id}`} className="underline hover:text-ink">{job.company_name}</Link> · {job.location}
        {!!job.remote && " · Remote"} · Posted {formatPostedAge(job.created_at)}
      </p>
      <div className="mt-6 p-4 rounded-lg bg-paper-dim">
        <Ledger min={job.salary_min} max={job.salary_max} />
      </div>
      <div className="mt-6 text-base leading-relaxed"><FormattedMessage body={job.description} /></div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Tag tone="moss">{job.category}</Tag>
        <Tag>{job.employment_type}</Tag>
        {job.experience_level && <Tag>{job.experience_level}</Tag>}
        {parseSkills(job.skills).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>
      {languages.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted mb-1.5">Languages needed:</p>
          <LanguageTags languages={languages} />
        </div>
      )}

      <div className="mt-8 p-5 rounded-xl border border-line bg-white">
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
