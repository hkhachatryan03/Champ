import { getSession } from "@/lib/auth";
import { getCompanyProfile, listActiveJobsForCompanyPublic, listSocialLinks } from "@/lib/queries";
import { redirect } from "next/navigation";
import FormattedMessage from "@/components/FormattedMessage";
import JobCard from "@/components/JobCard";

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
  const socialLinks = await listSocialLinks(companyUserId);

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="p-5 rounded-xl border border-line bg-white">
        <div className="flex items-center gap-3">
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
          )}
          <div>
            <h1 className="font-display font-semibold text-2xl">{profile.name}</h1>
            <p className="text-sm text-muted mt-0.5">
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
          </div>
        </div>
        {profile.address && <p className="text-sm text-muted mt-2">📍 {profile.address}</p>}
        {profile.phone && <p className="text-sm text-muted mt-0.5">📞 {profile.phone}</p>}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {socialLinks.map((s) => (
              <a
                key={s.id}
                href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline text-apricot-deep"
              >
                {s.platform}
              </a>
            ))}
          </div>
        )}
        {profile.about && (
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-xs font-medium text-muted mb-2">About</p>
            <div className="text-sm leading-relaxed"><FormattedMessage body={profile.about} /></div>
          </div>
        )}
      </div>

      <h2 className="font-display font-semibold text-lg mt-8 mb-4">
        Open roles ({jobs.length})
      </h2>
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={{ ...job, company_name: profile.name, company_avatar_url: profile.avatar_url }}
            applied={false}
            href={session.role === "candidate" ? `/candidate/jobs/${job.id}` : `/jobs/${job.id}`}
          />
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-muted">No open roles from this company right now.</p>
        )}
      </div>
    </div>
  );
}
