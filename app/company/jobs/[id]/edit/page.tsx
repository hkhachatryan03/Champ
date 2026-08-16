import { getSession } from "@/lib/auth";
import { updateJob } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import JobForm from "@/components/JobForm";
import sql from "@/lib/db";
import { Job } from "@/lib/queries";

async function saveJobAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const jobId = Number(formData.get("jobId"));
  const skills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const description = String(formData.get("description") || "").trim();
  if (!description) redirect(`/company/jobs/${jobId}/edit?error=1`);

  const salaryMin = Number(formData.get("salaryMin") || 0);
  const salaryMax = Number(formData.get("salaryMax") || 0);
  if (salaryMax < salaryMin) redirect(`/company/jobs/${jobId}/edit?error=salary`);

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
  });

  redirect("/company/dashboard");
}

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const { id } = await params;
  const { error } = await searchParams;
  const rows = (await sql`
    SELECT * FROM jobs WHERE id = ${Number(id)} AND company_user_id = ${session.userId}
  `) as Job[];
  const job = rows[0];

  if (!job) {
    return <div className="px-6 py-10 max-w-lg mx-auto text-sm text-muted">Role not found.</div>;
  }

  const boundAction = async (formData: FormData) => {
    "use server";
    formData.set("jobId", String(job.id));
    await saveJobAction(formData);
  };

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="font-display font-semibold text-2xl mb-6">Edit role</h1>
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
      <JobForm
        action={boundAction}
        isEdit
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
        }}
      />
    </div>
  );
}
