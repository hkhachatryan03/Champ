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

  await createJob(session.userId, {
    title: String(formData.get("title") || ""),
    category: String(formData.get("category") || "Tech") as "Tech" | "Non-tech",
    employment_type: String(formData.get("employmentType") || "Full-time") as "Full-time" | "Part-time",
    location: String(formData.get("location") || ""),
    remote: formData.get("remote") ? 1 : 0,
    salary_min: Number(formData.get("salaryMin") || 0),
    salary_max: Number(formData.get("salaryMax") || 0),
    skills: JSON.stringify(skills),
    description,
  });

  redirect("/company/dashboard");
}

export default async function NewJobPage() {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="font-display font-semibold text-2xl mb-6">Post a role</h1>
      <JobForm action={createJobAction} />
    </div>
  );
}
