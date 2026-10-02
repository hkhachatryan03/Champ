import { getSession } from "@/lib/auth";
import { getCompanyProfile, listActiveJobsForCompanyPublic, listSocialLinks } from "@/lib/queries";
import { redirect } from "next/navigation";
import FormattedMessage from "@/components/FormattedMessage";
import JobCard from "@/components/JobCard";
import GuestPage from "@/components/GuestPage";
import Reveal from "@/components/Reveal";
import { MapPin, Phone } from "lucide-react";

export default async function PublicCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const companyUserId = Number(id);
  const profile = await getCompanyProfile(companyUserId);

  if (!profile || !profile.onboarded) {
    return (
      <GuestPage>
        <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-2xl mx-auto">
          <div className="aur-bezel">
            <div className="aur-bezel-inner p-7 text-sm text-paper/60">Company not found.</div>
          </div>
        </div>
      </GuestPage>
    );
  }

  const jobs = await listActiveJobsForCompanyPublic(companyUserId);
  const socialLinks = await listSocialLinks(companyUserId);

  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-[780px] mx-auto">
        <div className="aur-hero-in">
          <div className="aur-bezel">
            <div className="aur-bezel-inner p-6 md:p-[30px]">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="w-[84px] h-[84px] rounded-[26px] flex-shrink-0 bg-gradient-to-br from-[#2a2f38] to-[#171A1F] border border-paper/15 shadow-[inset_0_1px_1px_rgba(250,246,238,.12)] flex items-center justify-center overflow-hidden font-display font-semibold text-[32px] text-apricot">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (profile.name || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="font-display font-semibold text-[clamp(28px,4vw,36px)] leading-[1.1] text-paper">{profile.name}</h1>
                  <p className="text-sm text-paper/62 mt-[7px]">
                    {profile.industry} {profile.industry && "·"} {profile.size}
                    {profile.website && (
                      <>
                        {" · "}
                        <a
                          href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-[3px] text-paper hover:text-apricot transition-colors"
                        >
                          {profile.website}
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
              {(profile.address || profile.phone) && (
                <div className="flex flex-wrap gap-x-[22px] gap-y-2 mt-5 text-[13.5px] text-paper/62">
                  {profile.address && <span className="inline-flex items-center gap-2"><MapPin size={15} strokeWidth={1.4} className="text-apricot" /> {profile.address}</span>}
                  {profile.phone && <span className="inline-flex items-center gap-2"><Phone size={15} strokeWidth={1.4} className="text-apricot" /> {profile.phone}</span>}
                </div>
              )}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {socialLinks.map((sl) => (
                    <a
                      key={sl.id}
                      href={sl.url.startsWith("http") ? sl.url : `https://${sl.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aur-tag no-underline hover:border-apricot hover:text-apricot transition-colors"
                    >
                      {sl.platform}
                    </a>
                  ))}
                </div>
              )}
              {profile.about && (
                <div className="mt-[22px] pt-5 border-t border-paper/10">
                  <p className="aur-kicker mb-2.5">About</p>
                  <div className="text-[15px] leading-[1.75] text-paper/75 [&_strong]:text-paper [&_b]:text-paper [&_li::marker]:text-apricot">
                    <FormattedMessage body={profile.about} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="font-display font-semibold text-2xl mt-9 mb-4 flex items-baseline gap-3 text-paper">
          Open roles <small className="font-mono-num text-xs text-paper/40 font-medium">{jobs.length}</small>
        </h2>
        <div className="flex flex-col gap-3.5">
          {jobs.map((job) => (
            <Reveal key={job.id}>
              <JobCard
                glass
                job={{ ...job, company_name: profile.name, company_avatar_url: profile.avatar_url }}
                applied={false}
                href={session.role === "candidate" ? `/candidate/jobs/${job.id}` : `/jobs/${job.id}`}
              />
            </Reveal>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-paper/55">No open roles from this company right now.</p>
          )}
        </div>
      </div>
    </GuestPage>
  );
}
