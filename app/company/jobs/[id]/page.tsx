import { getSession } from "@/lib/auth";
import { listApplicationsForJob, parseSkills, archiveJob, restoreArchivedJob } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import sql from "@/lib/db";
import { Job } from "@/lib/queries";
import GuestPage from "@/components/GuestPage";
import { ArrowLeft, Pencil } from "lucide-react";
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
    return (
      <GuestPage>
        <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-2xl mx-auto">
          <div className="aur-bezel">
            <div className="aur-bezel-inner p-7 text-sm text-paper/60">Role not found.</div>
          </div>
        </div>
      </GuestPage>
    );
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
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2rem)] pb-24 max-w-[1080px] mx-auto">
        <Link href="/company/dashboard" className="aur-hero-in inline-flex items-center gap-2 text-[13.5px] text-paper/60 hover:text-paper hover:-translate-x-[3px] transition-[color,transform] duration-300 mb-[18px]">
          <ArrowLeft size={16} strokeWidth={1.25} /> Back to your roles
        </Link>

        <div className="aur-hero-in flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3.5 flex-wrap">
              <h1 className="font-display font-semibold text-[clamp(32px,5vw,44px)] leading-[1.1] text-paper">{job.title}</h1>
              {job.archived_at ? (
                <span className="aur-tag">Archived</span>
              ) : !job.active ? (
                <span className="aur-tag">Paused</span>
              ) : null}
            </div>
            <p className="text-[15px] text-paper/60 mt-2.5">
              {job.category} · {job.employment_type} · {job.location}
              {job.experience_level && ` · ${job.experience_level}`}
            </p>
          </div>
          {!job.archived_at && (
            <Link href={`/company/jobs/${job.id}/edit`} className="aur-btn aur-btn-primary !py-[11px] !pl-5 !pr-2 whitespace-nowrap">
              Edit role
              <span className="aur-btn-icon"><Pencil size={13} /></span>
            </Link>
          )}
        </div>

        {job.archived_at && (
          <div className="mt-[18px] px-[22px] py-[18px] rounded-[20px] bg-paper/[.045] border border-paper/15">
            <p className="text-[14.5px] font-semibold text-paper">This role is archived</p>
            <p className="text-[12.5px] leading-[1.65] text-paper/60 mt-[5px]">
              Nothing is deleted yet — you can restore it any time in the next {daysUntilPermanentDelete} day
              {daysUntilPermanentDelete === 1 ? "" : "s"}. After that, this role and every conversation tied to
              it are permanently deleted and can&apos;t be recovered.
            </p>
            <form action={restoreJobAction} className="mt-3.5">
              <input type="hidden" name="jobId" value={job.id} />
              <button type="submit" className="aur-btn aur-btn-primary !py-[11px] !px-5 !text-[13.5px]">
                Restore this role
              </button>
            </form>
          </div>
        )}

        <div className="mt-[22px] aur-hero-in" style={{ animationDelay: ".1s" }}>
          <div className="aur-bezel">
            <div className="aur-bezel-inner px-6 py-5 md:px-[26px] flex flex-col gap-2">
              <span className="text-xs font-medium tracking-[.12em] uppercase text-paper/50">Salary range</span>
              <div className="flex items-baseline gap-3.5 font-mono-num font-medium text-[clamp(24px,4vw,32px)] text-apricot">
                <span>${job.salary_min}</span>
                <span className="flex-1 border-b border-dotted border-paper/30 min-w-5 -translate-y-1.5" />
                <span>${job.salary_max}</span>
                <span className="text-sm text-paper/50">/mo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2 aur-hero-in" style={{ animationDelay: ".16s" }}>
          {parseSkills(job.skills).map((s) => <span key={s} className="aur-tag !px-3.5 !py-1.5 !text-[13px]">{s}</span>)}
          {!!job.remote && <span className="aur-tag !px-3.5 !py-1.5 !text-[13px] !bg-[rgba(127,176,138,.12)] !border-[rgba(127,176,138,.35)] !text-[#8FC79B]">Remote</span>}
          {languages.map((entry) => {
            const [lang, level] = entry.split(":");
            return <span key={entry} className="aur-tag !px-3.5 !py-1.5 !text-[13px] !bg-paper/[.045]">{lang}{level ? ` · ${level}` : ""}</span>;
          })}
        </div>

        <div className="mt-[30px] aur-hero-in" style={{ animationDelay: ".22s" }}>
          <JobApplicantsView
            glass
            applicants={applicants}
            description={
              <div className="aur-bezel">
                <div className="aur-bezel-inner px-[26px] py-6">
                  <p className="aur-kicker mb-3">Description</p>
                  <div className="text-[15px] leading-[1.75] text-paper/75 [&_strong]:text-paper [&_b]:text-paper [&_li::marker]:text-apricot">
                    <FormattedMessage body={job.description} />
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {!job.archived_at && (
          <div className="aur-bezel mt-10">
            <div className="aur-bezel-inner px-6 py-5">
              <p className="text-[14.5px] font-semibold text-paper">Archive this role</p>
              <p className="text-[12.5px] leading-[1.65] text-paper/55 mt-[5px] mb-3.5 max-w-[640px]">
                Use this once the role is permanently closed — someone was hired and passed
                probation, you&apos;re no longer hiring for it, etc. Archiving is different from
                pausing: it hides the role and every conversation tied to it, but nothing is
                deleted for 3 months, so you can still restore it if needed.
              </p>
              <form action={archiveJobAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <button type="submit" className="aur-btn border border-paper/15 text-paper !text-[13.5px] !py-[11px] !px-5 hover:border-apricot hover:text-apricot">
                  Archive this role
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </GuestPage>
  );
}
