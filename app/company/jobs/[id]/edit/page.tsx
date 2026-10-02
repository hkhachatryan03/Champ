import { getSession } from "@/lib/auth";
import { updateJob, normalizeAndRegisterTerms, listCustomTerms } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import GuestPage from "@/components/GuestPage";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JobForm, { JobFormState } from "@/components/JobForm";
import sql from "@/lib/db";
import { Job } from "@/lib/queries";
import { sanitizeRichText } from "@/lib/sanitize";
import { COMMON_SKILLS } from "@/lib/constants";

async function saveJobAction(
  jobId: number,
  prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const rawSkills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const skills = await normalizeAndRegisterTerms("skill", rawSkills);
  const description = sanitizeRichText(String(formData.get("description") || ""));
  if (!description.replace(/<[^>]*>/g, "").trim()) return { error: "A description is required." };

  const salaryMin = Number(formData.get("salaryMin") || 0);
  const salaryMax = Number(formData.get("salaryMax") || 0);
  if (salaryMax < salaryMin) {
    return { error: "Max salary needs to be greater than or equal to min salary." };
  }

  const experienceLevel = String(formData.get("experienceLevel") || "").trim() || null;
  const languages = String(formData.get("languages") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await updateJob(jobId, session.userId, {
    title: String(formData.get("title") || ""),
    category: String(formData.get("category") || "Tech") as "Tech" | "Non-tech",
    employment_type: String(formData.get("employmentType") || "Full-time") as "Full-time" | "Part-time",
    location: String(formData.get("location") || ""),
    remote: formData.get("remote") ? 1 : 0,
    salary_min: salaryMin,
    salary_max: salaryMax,
    skills: JSON.stringify(skills),
    description,
    active: formData.get("active") ? 1 : 0,
    experience_level: experienceLevel,
    languages: JSON.stringify(languages),
    client_name: String(formData.get("clientName") || "").trim(),
  });

  redirect(`/company/jobs/${jobId}`);
}

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
      <Link href={`/company/jobs/${job.id}`} className="aur-hero-in inline-flex items-center gap-2 text-[13.5px] text-paper/60 hover:text-paper hover:-translate-x-[3px] transition-[color,transform] duration-300 mb-4">
        <ArrowLeft size={16} strokeWidth={1.25} /> Back to the role
      </Link>
      <h1 className="aur-hero-in font-display font-semibold text-[clamp(34px,5vw,44px)] leading-[1.1] text-paper">Edit role</h1>
      <p className="aur-hero-in text-[14.5px] text-paper/60 mt-2.5 mb-6" style={{ animationDelay: ".08s" }}>Changes go live as soon as you save.</p>
      <JobForm
        glass
        action={boundAction}
        isEdit
        cancelHref={`/company/jobs/${job.id}`}
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
     </div>
    </GuestPage>
  );
}
