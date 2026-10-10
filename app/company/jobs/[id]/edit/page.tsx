import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getSession } from "@/lib/auth";
import { updateJob, publishDraftJob, listCustomTerms } from "@/lib/queries";
import { readIntent, readJobFields, publishError } from "@/lib/jobFields";
import { toJobRecord } from "@/lib/jobSubmission";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { deleteDraftAction } from "@/app/company/jobs/actions";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import GuestPage from "@/components/GuestPage";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JobForm, { JobFormState } from "@/components/JobForm";
import sql from "@/lib/db";
import { Job } from "@/lib/queries";
import { COMMON_SKILLS } from "@/lib/constants";

async function saveJobAction(
  jobId: number,
  prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const rows = (await sql`
    SELECT is_draft FROM jobs WHERE id = ${jobId} AND company_user_id = ${session.userId}
  `) as { is_draft: number }[];
  if (!rows[0]) return { error: "This role no longer exists." };
  const wasDraft = Number(rows[0].is_draft) === 1;

  const fields = readJobFields(formData);

  // Still a draft, and the person pressed "Save draft".
  if (wasDraft && readIntent(formData) === "draft") {
    const record = await toJobRecord({ ...fields, title: fields.title || "Untitled draft" }, { registerTerms: false });
    await updateJob(jobId, session.userId, { ...record, active: 0 });
    redirect("/company/dashboard?notice=draft-saved");
  }

  // Everything else is a real save/publish, so the full rules apply. (A forged
  // "draft" request against an already-live role lands here too, and is simply
  // treated as a normal save — it can never un-publish a role.)
  const error = publishError(fields);
  if (error) return { error };
  const record = await toJobRecord(fields, { registerTerms: true });

  if (wasDraft) {
    // Save while still hidden, then flip to live in ONE statement — so a
    // failure part-way can never leave a half-published role visible.
    await updateJob(jobId, session.userId, { ...record, active: 0 });
    await publishDraftJob(jobId, session.userId);
    redirect("/company/dashboard?notice=published");
  }

  await updateJob(jobId, session.userId, { ...record, active: formData.get("active") ? 1 : 0 });
  redirect(`/company/jobs/${jobId}`);
}

export const metadata: Metadata = pageMetadata({
  title: "Edit role",
  description: "Edit a role's details, salary range and visibility on Champ.",
  noindex: true,
});

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const profile = await requireOnboardedCompany(session.userId);

  const { id } = await params;
  const rows = (await sql`
    SELECT * FROM jobs WHERE id = ${Number(id)} AND company_user_id = ${session.userId}
  `) as Job[];
  const job = rows[0];

  if (!job) {
    return (
      <GuestPage>
        <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-lg mx-auto">
          <div className="aur-bezel">
            <div className="aur-bezel-inner p-7 text-sm text-paper/60">Role not found.</div>
          </div>
        </div>
      </GuestPage>
    );
  }

  const boundAction = saveJobAction.bind(null, job.id);
  const skillOptions = [...COMMON_SKILLS, ...(await listCustomTerms("skill"))];

  return (
    <GuestPage>
     <div className="px-6 pt-[calc(var(--nav-h)+2rem)] pb-14 max-w-[760px] mx-auto">
      <Link href={job.is_draft ? "/company/dashboard" : `/company/jobs/${job.id}`} className="aur-hero-in inline-flex items-center gap-2 text-[13.5px] text-paper/60 hover:text-paper hover:-translate-x-[3px] transition-[color,transform] duration-300 mb-4">
        <ArrowLeft size={16} strokeWidth={1.25} /> {job.is_draft ? "Back to your roles" : "Back to the role"}
      </Link>
      <h1 className="aur-hero-in font-display font-semibold text-[clamp(34px,5vw,44px)] leading-[1.1] text-paper">{job.is_draft ? "Edit draft" : "Edit role"}</h1>
      <p className="aur-hero-in text-[14.5px] text-paper/60 mt-2.5 mb-6" style={{ animationDelay: ".08s" }}>{job.is_draft ? "Only you can see this draft. Post it when it's ready." : "Changes go live as soon as you save."}</p>
      <JobForm
        glass
        action={boundAction}
        isEdit
        isDraft={!!job.is_draft}
        cancelHref={job.is_draft ? "/company/dashboard" : `/company/jobs/${job.id}`}
        skillOptions={skillOptions}
        defaults={{
          title: job.title,
          category: job.category,
          employment_type: job.employment_type,
          location: job.location,
          remote: job.remote,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          skills: JSON.parse(job.skills).join(", "),
          description: job.description,
          active: job.active,
          experience_level: job.experience_level,
          languages: JSON.parse(job.languages || "[]").join(", "),
          client_name: job.client_name,
        }}
        showClientNameField={profile.recruiter_type === "agency"}
      />
      {!!job.is_draft && (
        <form action={deleteDraftAction} className="mt-7">
          <input type="hidden" name="jobId" value={job.id} />
          <ConfirmSubmitButton
            message="Delete this draft? This can't be undone."
            className="text-[13px] underline underline-offset-[3px] text-paper/50 hover:text-apricot transition-colors"
          >
            Delete this draft
          </ConfirmSubmitButton>
        </form>
      )}
     </div>
    </GuestPage>
  );
}
