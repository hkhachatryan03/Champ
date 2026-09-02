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
import { Ledger, Tag, StatusPill, LanguageTags } from "@/components/ui";
import sql from "@/lib/db";
import FormattedMessage from "@/components/FormattedMessage";
import BackButton from "@/components/BackButton";

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
    return <div className="px-6 py-10 max-w-lg mx-auto text-sm text-muted">Candidate not found.</div>;
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

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <BackButton fallbackHref="/company/candidates" />

      <div className="grid md:grid-cols-3 gap-6 mt-4 items-start">
        {/* Left column: everything about the candidate */}
        <div className="md:col-span-2 flex flex-col gap-5">
          <div className="p-5 rounded-xl border border-line bg-white">
            <div className="flex items-center gap-3">
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              )}
              <div>
                <div className="font-display font-semibold text-xl">{profile.name || "(unnamed candidate)"}</div>
                <div className="text-sm text-muted">{profile.title} · {profile.years_experience} yrs experience</div>
              </div>
            </div>
            {profile.location && <p className="text-sm text-muted mt-2">📍 {profile.location}</p>}
            {profile.birthdate && (
              <p className="text-sm text-muted mt-0.5">
                🎂 {new Date(profile.birthdate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((s) => <Tag key={s}>{s}</Tag>)}
              {!!profile.remote_ok && <Tag tone="moss">Remote OK</Tag>}
            </div>
            <div className="mt-3"><Ledger min={profile.salary_min} max={profile.salary_max} /></div>
            {JSON.parse(profile.languages || "[]").length > 0 && (
              <div className="mt-2"><LanguageTags languages={JSON.parse(profile.languages || "[]")} /></div>
            )}
            {profile.about && <div className="text-sm mt-3"><FormattedMessage body={profile.about} /></div>}
            <div className="mt-3 flex flex-col gap-1">
              {profile.cv_filename && (
                <a href={profile.cv_filename} target="_blank" rel="noopener noreferrer" className="text-sm underline text-apricot-deep w-fit">
                  📎 View CV
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline text-apricot-deep"
                >
                  🔗 {profile.linkedin_url}
                </a>
              )}
            </div>
          </div>

          {experiences.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-3">Work experience</h2>
              <div className="relative pl-5">
                <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-line" />
                <div className="flex flex-col gap-4">
                  {experiences.map((e) => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-apricot border-2 border-white shadow-sm" />
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="text-sm text-muted">{e.company}</div>
                      <div className="text-xs text-muted mt-0.5 font-mono-num">
                        {e.start_year} – {e.end_year || "Present"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-3">Education</h2>
              <div className="relative pl-5">
                <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-line" />
                <div className="flex flex-col gap-4">
                  {education.map((e) => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-moss border-2 border-white shadow-sm" />
                      <div className="text-sm font-medium">{e.institution}</div>
                      <div className="text-sm text-muted">
                        {e.degree}{e.field_of_study && ` · ${e.field_of_study}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-2">Certifications</h2>
              <div className="flex flex-col gap-2">
                {certifications.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-line bg-white flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      {c.provider && <div className="text-xs text-muted">{c.provider}</div>}
                    </div>
                    {(c.link_url || c.file_url) && (
                      <a href={c.link_url || c.file_url || "#"} target="_blank" rel="noopener noreferrer" className="text-xs underline text-apricot-deep">
                        View →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSelfPreview && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-2">Invite to a role</h2>
              {myJobs.length === 0 ? (
                <p className="text-sm text-muted">
                  {activeJobs.length === 0 ? (
                    <>You don&apos;t have any active roles to invite them to yet — <Link href="/company/jobs/new" className="underline">post one first</Link>.</>
                  ) : (
                    "This candidate is already connected on all of your active roles."
                  )}
                </p>
              ) : (
                <form action={inviteAction} className="p-4 rounded-lg bg-paper-dim flex flex-col gap-3">
                  <input type="hidden" name="candidateUserId" value={candidateUserId} />
                  <div>
                    <label className="text-xs font-medium text-muted">Which role?</label>
                    <select name="jobId" required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none">
                      {myJobs.map((j) => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Message (optional)</label>
                    <textarea name="message" rows={3} placeholder="Hi — your profile looks like a great fit, would you be open to a chat?" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
                  </div>
                  <button type="submit" className="px-5 py-2.5 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
                    Send invite
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right column: their status on your roles */}
        {!isSelfPreview && (
          <div className="md:sticky md:top-4">
            <h2 className="font-display font-semibold text-lg mb-2">Their status on your roles</h2>
            {existingConnections.length === 0 ? (
              <p className="text-sm text-muted">No connections yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {existingConnections.map(({ job, applicationId, status, expectedSalary }) => (
                  <Link
                    key={job.id}
                    href={`/thread/${applicationId}`}
                    prefetch={false}
                    className="p-3 rounded-lg border border-line bg-white block"
                  >
                    <div className="text-sm font-medium">{job.title}</div>
                    {expectedSalary && (
                      <div className="text-xs font-mono-num text-apricot-deep mt-0.5">${expectedSalary}/mo asked</div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <StatusPill status={status} />
                      <span className="text-xs underline text-apricot-deep">Chat →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </div>
        )}
      </div>

      {isSelfPreview && (
        <div className="mt-6 p-3 rounded-lg bg-paper-dim text-xs text-muted text-center">
          This is a preview of how recruiters see your profile.
        </div>
      )}
    </div>
  );
}
