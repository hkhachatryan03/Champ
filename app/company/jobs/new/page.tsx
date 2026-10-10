import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getSession } from "@/lib/auth";
import { createJob, listCustomTerms } from "@/lib/queries";
import { readIntent, readJobFields, publishError } from "@/lib/jobFields";
import { toJobRecord } from "@/lib/jobSubmission";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import JobForm, { JobFormState } from "@/components/JobForm";
import GuestPage from "@/components/GuestPage";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { COMMON_SKILLS } from "@/lib/constants";

async function createJobAction(prevState: JobFormState, formData: FormData): Promise<JobFormState> {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const fields = readJobFields(formData);

  // "Save draft": keep whatever is there, however unfinished. Private to this
  // company — and its skills aren't added to the shared suggestion list yet.
  if (readIntent(formData) === "draft") {
    const record = await toJobRecord({ ...fields, title: fields.title || "Untitled draft" }, { registerTerms: false });
    await createJob(session.userId, record, { isDraft: true });
    redirect("/company/dashboard?notice=draft-saved");
  }

  // "Publish role": everything candidates rely on has to be there.
  const error = publishError(fields);
  if (error) return { error };
  await createJob(session.userId, await toJobRecord(fields, { registerTerms: true }));
  redirect("/company/dashboard?notice=published");
}

export const metadata: Metadata = pageMetadata({
  title: "Post a role",
  description: "Post a new role on Champ with a visible salary range, or save it as a draft and finish later.",
  noindex: true,
});

export default async function NewJobPage() {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const profile = await requireOnboardedCompany(session.userId);
  const skillOptions = [...COMMON_SKILLS, ...(await listCustomTerms("skill"))];

  return (
    <GuestPage>
     <div className="px-6 pt-[calc(var(--nav-h)+2rem)] pb-14 max-w-[760px] mx-auto">
      <Link href="/company/dashboard" className="aur-hero-in inline-flex items-center gap-2 text-[13.5px] text-paper/60 hover:text-paper hover:-translate-x-[3px] transition-[color,transform] duration-300 mb-4">
        <ArrowLeft size={16} strokeWidth={1.25} /> Back to your roles
      </Link>
      <h1 className="aur-hero-in font-display font-semibold text-[clamp(34px,5vw,44px)] leading-[1.1] text-paper">Post a role</h1>
      <p className="aur-hero-in text-[14.5px] text-paper/60 mt-2.5 mb-6" style={{ animationDelay: ".08s" }}>A visible salary range is required to post — it&apos;s the whole point of Champ. Not ready yet? Save it as a draft — only you will see it.</p>
      <JobForm
        glass
        action={createJobAction}
        cancelHref="/company/dashboard"
        skillOptions={skillOptions}
        showClientNameField={profile.recruiter_type === "agency"}
      />
     </div>
    </GuestPage>
  );
}
