import { getSession } from "@/lib/auth";
import {
  getCandidateProfile,
  parseSkills,
  listExperiences,
  listCertifications,
  listEducation,
  listJobsForCompany,
  findApplication,
  createApplication,
  sendMessage,
} from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import sql from "@/lib/db";
import FormattedMessage from "@/components/FormattedMessage";
import BackButton from "@/components/BackButton";
import GuestPage from "@/components/GuestPage";
import { ArrowRight, Cake, Eye, FileText, Link2, MapPin } from "lucide-react";

async function inviteAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const jobId = Number(formData.get("jobId"));
  const candidateUserId = Number(formData.get("candidateUserId"));
  const message = String(formData.get("message") || "").trim();

  // Make sure this job actually belongs to this company before inviting.
  const jobRows = await sql`SELECT id FROM jobs WHERE id = ${jobId} AND company_user_id = ${session.userId}`;
  if (!jobRows[0]) redirect("/company/dashboard");

  const existing = await findApplication(jobId, candidateUserId);
  if (existing) {
    redirect(`/thread/${existing.id}`);
  }

  const applicationId = await createApplication(jobId, candidateUserId, "", null, null, "pending");
  if (message) {
    await sendMessage(applicationId, "company", message);
  }
  redirect(`/thread/${applicationId}`);
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const candidateUserId = Number(id);
  const isSelfPreview = session.role === "candidate" && session.userId === candidateUserId;
  if (!isSelfPreview && session.role !== "company") redirect("/login");
  if (session.role === "company") await requireOnboardedCompany(session.userId);

  const profile = await getCandidateProfile(candidateUserId);

  if (!profile || !profile.onboarded) {
    return (
      <GuestPage>
        <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-lg mx-auto">
          <div className="aur-bezel">
            <div className="aur-bezel-inner p-7 text-sm text-paper/60">Candidate not found.</div>
          </div>
        </div>
      </GuestPage>
    );
  }

  const skills = parseSkills(profile.skills);
  const experiences = await listExperiences(candidateUserId);
  const certifications = await listCertifications(candidateUserId);
  const education = await listEducation(candidateUserId);
  const activeJobs = isSelfPreview ? [] : (await listJobsForCompany(session.userId)).filter((j) => j.active);
  const myJobs = [];
  const existingConnections: { job: typeof activeJobs[number]; applicationId: number; status: string; expectedSalary: number | null }[] = [];
  for (const j of activeJobs) {
    const existing = await findApplication(j.id, candidateUserId);
    if (existing) {
      existingConnections.push({ job: j, applicationId: existing.id, status: existing.status, expectedSalary: existing.expected_salary });
    } else {
      myJobs.push(j);
    }
  }

  const languageList: string[] = JSON.parse(profile.languages || "[]");

  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+1.75rem)] pb-24 max-w-[1060px] mx-auto">
        <div className={`aur-hero-in flex flex-wrap items-center justify-between gap-3.5 mb-[18px] ${isSelfPreview ? "max-w-[780px] mx-auto" : ""}`}>
          <BackButton glass fallbackHref={isSelfPreview ? "/candidate/profile" : "/company/candidates"} />
          {isSelfPreview && (
            <div className="flex items-center gap-[11px] px-4 py-2.5 rounded-full bg-apricot/10 border border-apricot/30 text-[13.5px] text-paper">
              <Eye size={17} strokeWidth={1.4} className="text-apricot flex-shrink-0" />
              This is a preview of how recruiters see your profile.
            </div>
          )}
        </div>

        <div className={isSelfPreview ? "" : "grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_330px] gap-7 items-start"}>
          {/* Left column: everything about the candidate */}
          <div className={`flex flex-col gap-[30px] min-w-0 ${isSelfPreview ? "max-w-[780px] mx-auto" : ""}`}>
            <div className="aur-hero-in" style={{ animationDelay: ".08s" }}>
              <div className="aur-bezel">
                <div className="aur-bezel-inner p-6 md:p-[30px]">
                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="w-[88px] h-[88px] rounded-[28px] flex-shrink-0 bg-gradient-to-br from-[#2a2f38] to-[#171A1F] border border-paper/15 shadow-[inset_0_1px_1px_rgba(250,246,238,.12)] flex items-center justify-center overflow-hidden font-display font-semibold text-[34px] text-apricot">
                      {profile.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (profile.name || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <h1 className="font-display font-semibold text-[clamp(26px,4vw,32px)] leading-[1.12] text-paper">{profile.name || "(unnamed candidate)"}</h1>
                      <p className="text-[14.5px] text-paper/62 mt-1.5">{profile.title} · {profile.years_experience} yrs experience</p>
                    </div>
                    <div className="aur-sal !px-4 !py-2 !text-sm max-md:w-full">
                      <span>${profile.salary_min}</span>
                      <span className="aur-dots" />
                      <span>${profile.salary_max}</span>
                      <small>/mo</small>
                    </div>
                  </div>

                  {(profile.location || profile.birthdate) && (
                    <div className="flex flex-wrap gap-x-[22px] gap-y-2 mt-5 text-[13.5px] text-paper/62">
                      {profile.location && (
                        <span className="inline-flex items-center gap-2"><MapPin size={15} strokeWidth={1.4} className="text-apricot" /> {profile.location}</span>
                      )}
                      {profile.birthdate && (
                        <span className="inline-flex items-center gap-2">
                          <Cake size={15} strokeWidth={1.4} className="text-apricot" />
                          {new Date(profile.birthdate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-[18px] flex flex-wrap gap-1.5">
                    {skills.map((s) => <span key={s} className="aur-tag !px-[11px] !py-1 !text-[12.5px] !text-paper/75">{s}</span>)}
                    {!!profile.remote_ok && <span className="aur-tag aur-tag-ok !px-[11px] !py-1 !text-[12.5px]">Remote OK</span>}
                  </div>
                  {languageList.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {languageList.map((entry) => {
                        const [lang, level] = entry.split(":");
                        return <span key={entry} className="aur-tag !px-[11px] !py-1 !text-[12.5px] bg-paper/[.045]">{lang}{level ? ` · ${level}` : ""}</span>;
                      })}
                    </div>
                  )}

                  {profile.about && (
                    <div className="mt-[22px] pt-5 border-t border-paper/10 text-[15px] leading-[1.75] text-paper/75 [&_strong]:text-paper [&_b]:text-paper [&_li::marker]:text-apricot">
                      <FormattedMessage body={profile.about} />
                    </div>
                  )}

                  {(profile.cv_filename || profile.linkedin_url) && (
                    <div className="flex flex-wrap gap-2.5 mt-[22px]">
                      {profile.cv_filename && (
                        <a href={profile.cv_filename} target="_blank" rel="noopener noreferrer" className="aur-lnk">
                          <FileText size={15} strokeWidth={1.4} /> View CV
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aur-lnk"
                        >
                          <Link2 size={15} strokeWidth={1.4} /> {profile.linkedin_url}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {experiences.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-2xl mb-3.5 flex items-baseline gap-3 text-paper">Work experience <small className="font-mono-num text-xs text-paper/40 font-medium">{experiences.length}</small></h2>
                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner px-[26px] py-6">
                    <div className="aur-tl">
                      {experiences.map((e) => (
                        <div key={e.id} className="aur-ti aur-ti-exp">
                          <b>{e.title}</b>
                          <div className="aur-ti-co">{e.company}</div>
                          <div className="aur-ti-yr">{e.start_year} – {e.end_year || "Present"}</div>
                          {e.description && (
                            <div className="aur-ti-ds"><FormattedMessage body={e.description} /></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {education.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-2xl mb-3.5 flex items-baseline gap-3 text-paper">Education <small className="font-mono-num text-xs text-paper/40 font-medium">{education.length}</small></h2>
                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner px-[26px] py-6">
                    <div className="aur-tl">
                      {education.map((e) => (
                        <div key={e.id} className="aur-ti aur-ti-edu">
                          <b>{e.institution}</b>
                          <div className="aur-ti-co">
                            {e.degree}{e.field_of_study && ` · ${e.field_of_study}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {certifications.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-2xl mb-3.5 flex items-baseline gap-3 text-paper">Certifications <small className="font-mono-num text-xs text-paper/40 font-medium">{certifications.length}</small></h2>
                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner px-[26px] py-6">
                    <div className="aur-tl">
                      {certifications.map((c) => (
                        <div key={c.id} className="aur-ti aur-ti-crt">
                          <b>{c.name}</b>
                          <div className="aur-ti-co flex items-center gap-1.5 flex-wrap">
                            {c.provider}
                            {(c.link_url || c.file_url) && (
                              <>
                                {c.provider && <span>·</span>}
                                <a href={c.link_url || c.file_url || "#"} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-[3px] text-apricot">
                                  View certificate →
                                </a>
                              </>
                            )}
                          </div>
                          {c.issue_date && (
                            <div className="aur-ti-yr">
                              {new Date(c.issue_date + "-02").toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {!isSelfPreview && (
              <section>
                <h2 className="font-display font-semibold text-2xl mb-3.5 text-paper">Invite to a role</h2>
                {myJobs.length === 0 ? (
                  <p className="text-sm leading-[1.65] text-paper/60">
                    {activeJobs.length === 0 ? (
                      <>You don&apos;t have any active roles to invite them to yet — <Link href="/company/jobs/new" className="underline underline-offset-[3px] text-apricot">post one first</Link>.</>
                    ) : (
                      "This candidate is already connected on all of your active roles."
                    )}
                  </p>
                ) : (
                  <div className="aur-bezel">
                    <form action={inviteAction} className="aur-bezel-inner p-[22px] flex flex-col gap-3.5">
                      <input type="hidden" name="candidateUserId" value={candidateUserId} />
                      <div>
                        <label className="aur-label">Which role?</label>
                        <select name="jobId" required className="aur-field">
                          {myJobs.map((j) => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="aur-label">Message (optional)</label>
                        <textarea name="message" rows={3} placeholder="Hi — your profile looks like a great fit, would you be open to a chat?" className="aur-field" />
                      </div>
                      <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine self-start !pl-[22px] !pr-2">
                        Send invite
                        <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                      </button>
                    </form>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right column: their status on your roles */}
          {!isSelfPreview && (
            <aside className="md:sticky md:top-[96px]">
              <h2 className="font-display font-semibold text-xl mb-3 text-paper">Their status on your roles</h2>
              {existingConnections.length === 0 ? (
                <p className="text-sm text-paper/55">No connections yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {existingConnections.map(({ job, applicationId, status, expectedSalary }) => (
                    <Link
                      key={job.id}
                      href={`/thread/${applicationId}`}
                      prefetch={false}
                      className="block px-4 py-3.5 rounded-[18px] bg-paper/[.045] border border-paper/10 transition-[border-color,transform,background] duration-300 hover:border-apricot/45 hover:bg-apricot/[.06] hover:-translate-y-0.5"
                    >
                      <div className="text-[14.5px] font-medium text-paper">{job.title}</div>
                      {expectedSalary && (
                        <div className="text-xs font-mono-num text-apricot mt-0.5">${expectedSalary}/mo asked</div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <StatusPill glass status={status} />
                        <span className="text-[12.5px] underline underline-offset-[3px] text-apricot">Chat →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </GuestPage>
  );
}
