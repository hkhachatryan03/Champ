import { getSession } from "@/lib/auth";
import { createJob, normalizeAndRegisterTerms, listCustomTerms } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import JobForm, { JobFormState } from "@/components/JobForm";
import GuestPage from "@/components/GuestPage";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { sanitizeRichText } from "@/lib/sanitize";
import { COMMON_SKILLS } from "@/lib/constants";

async function createJobAction(prevState: JobFormState, formData: FormData): Promise<JobFormState> {
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

  await createJob(session.userId, {
    title: String(formData.get("title") || ""),
    category: String(formData.get("category") || "Tech") as "Tech" | "Non-tech",
    employment_type: String(formData.get("employmentType") || "Full-time") as "Full-time" | "Part-time",
    location: String(formData.get("location") || ""),
    remote: formData.get("remote") ? 1 : 0,
    salary_min: salaryMin,
    salary_max: salaryMax,
    skills: JSON.stringify(skills),
    description,
    experience_level: experienceLevel,
    languages: JSON.stringify(languages),
    client_name: String(formData.get("clientName") || "").trim(),
  });

  redirect("/company/dashboard");
}

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
      <p className="aur-hero-in text-[14.5px] text-paper/60 mt-2.5 mb-6" style={{ animationDelay: ".08s" }}>A visible salary range is required to post — it&apos;s the whole point of Champ.</p>
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
