import { getSession } from "@/lib/auth";
import { getCompanyProfile, listActiveJobsForCompanyPublic, parseSkills } from "@/lib/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ledger, Tag } from "@/components/ui";

export default async function PublicCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const companyUserId = Number(id);
  const profile = await getCompanyProfile(companyUserId);

  if (!profile || !profile.onboarded) {
    return <div className="px-6 py-10 max-w-2xl mx-auto text-sm text-muted">Company not found.</div>;
  }

  const jobs = await listActiveJobsForCompanyPublic(companyUserId);

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="p-5 rounded-xl border border-line bg-white">
        <div className="flex items-center gap-2">
          <h1 className="font-display font-semibold text-2xl">{profile.name}</h1>
        </div>
        <p className="text-sm text-muted mt-1">
          {profile.industry} {profile.industry && "·"} {profile.size}
          {profile.website && (
            <>
              {" · "}
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {profile.website}
              </a>
            </>
          )}
        </p>
        {profile.about && <p className="text-base mt-4 leading-relaxed">{profile.about}</p>}
      </div>

      <h2 className="font-display font-semibold text-lg mt-8 mb-4">
        Open roles ({jobs.length})
      </h2>
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/candidate/jobs/${job.id}`}
            className="block p-5 rounded-xl border border-line bg-white hover:shadow-sm transition"
          >
            <h3 className="font-display font-semibold text-lg">{job.title}</h3>
            <p className="text-sm text-muted mt-0.5">{job.location}</p>
            <div className="mt-3"><Ledger min={job.salary_min} max={job.salary_max} /></div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag tone="moss">{job.category}</Tag>
              <Tag>{job.employment_type}</Tag>
              {job.experience_level && <Tag>{job.experience_level}</Tag>}
              {!!job.remote && <Tag tone="moss">Remote</Tag>}
              {parseSkills(job.skills).map((t) => <Tag key={t}>{t}</Tag>)}
            </div>
          </Link>
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-muted">No open roles from this company right now.</p>
        )}
      </div>
    </div>
  );
}
