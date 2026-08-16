import { getSession } from "@/lib/auth";
import { createJob } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import JobForm from "@/components/JobForm";

async function createJobAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const skills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const description = String(formData.get("description") || "").trim();
  if (!description) redirect("/company/jobs/new?error=1");

  const salaryMin = Number(formData.get("salaryMin") || 0);
  const salaryMax = Number(formData.get("salaryMax") || 0);
  if (salaryMax < salaryMin) redirect("/company/jobs/new?error=salary");

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
  });

  redirect("/company/dashboard");
}

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);
  const { error } = await searchParams;

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="font-display font-semibold text-2xl mb-6">Post a role</h1>
      {error === "1" && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          A description is required.
        </div>
      )}
      {error === "salary" && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Max salary needs to be greater than or equal to min salary.
        </div>
      )}
      <JobForm action={createJobAction} />
    </div>
  );
}
