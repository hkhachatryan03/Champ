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

  await updateJob(jobId, session.userId, {
    title: String(formData.get("title") || ""),
    category: String(formData.get("category") || "Tech") as "Tech" | "Non-tech",
    employment_type: String(formData.get("employmentType") || "Full-time") as "Full-time" | "Part-time",
    location: String(formData.get("location") || ""),
    remote: formData.get("remote") ? 1 : 0,
    salary_min: Number(formData.get("salaryMin") || 0),
    salary_max: Number(formData.get("salaryMax") || 0),
    skills: JSON.stringify(skills),
    description,
    active: formData.get("active") ? 1 : 0,
  });

  redirect("/company/dashboard");
}

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const { id } = await params;
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
        }}
      />
    </div>
  );
}
