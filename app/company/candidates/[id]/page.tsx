import { getSession } from "@/lib/auth";
import {
  getCandidateProfile,
  parseSkills,
  listExperiences,
  listJobsForCompany,
  findApplication,
  createApplication,
  sendMessage,
} from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ledger, Tag } from "@/components/ui";
import sql from "@/lib/db";

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
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const { id } = await params;
  const candidateUserId = Number(id);
  const profile = await getCandidateProfile(candidateUserId);

  if (!profile || !profile.onboarded) {
    return <div className="px-6 py-10 max-w-lg mx-auto text-sm text-muted">Candidate not found.</div>;
  }

  const skills = parseSkills(profile.skills);
  const experiences = await listExperiences(candidateUserId);
  const activeJobs = (await listJobsForCompany(session.userId)).filter((j) => j.active);
  const myJobs = [];
  for (const j of activeJobs) {
    const existing = await findApplication(j.id, candidateUserId);
    if (!existing) myJobs.push(j);
  }

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <Link href="/company/dashboard" className="text-sm text-muted">← Back</Link>

      <div className="mt-4 p-5 rounded-xl border border-line bg-white">
        <div className="font-display font-semibold text-xl">{profile.name || "(unnamed candidate)"}</div>
        <div className="text-sm text-muted mt-1">{profile.title} · {profile.years_experience} yrs experience</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s) => <Tag key={s}>{s}</Tag>)}
          {!!profile.remote_ok && <Tag tone="moss">Remote OK</Tag>}
        </div>
        <div className="mt-3"><Ledger min={profile.salary_min} max={profile.salary_max} /></div>
        {JSON.parse(profile.languages || "[]").length > 0 && (
          <p className="text-sm text-muted mt-2">
            Languages: {JSON.parse(profile.languages || "[]").join(", ")}
          </p>
        )}
        {profile.about && <p className="text-sm mt-3">{profile.about}</p>}
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
        <div className="mt-5">
          <h2 className="font-display font-semibold text-lg mb-2">Work experience</h2>
          <div className="flex flex-col gap-2">
            {experiences.map((e) => (
              <div key={e.id} className="p-3 rounded-lg border border-line bg-white">
                <div className="text-sm font-medium">{e.title} · {e.company}</div>
                <div className="text-xs text-muted">{e.start_year} – {e.end_year || "Present"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-display font-semibold text-lg mt-6 mb-2">Invite to a role</h2>
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
  );
}
