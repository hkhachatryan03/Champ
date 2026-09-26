import Link from "next/link";
import { redirect } from "next/navigation";
import { listJobsAdmin, countJobsAdmin, removeJobAsAdmin } from "@/lib/adminQueries";
import { getAdminSession } from "@/lib/adminAuth";
import { parseSkills } from "@/lib/queries";

const PAGE_SIZE = 30;

async function removeJobAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const jobId = Number(formData.get("jobId"));
  const reason = String(formData.get("reason") || "Removed by admin");
  await removeJobAsAdmin(jobId, session!.email, reason);
  redirect("/admin/jobs");
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = "", q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const [jobs, total] = await Promise.all([
    listJobsAdmin({ status: status as any, search: q, limit: PAGE_SIZE, offset }),
    countJobsAdmin({ status, search: q }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Jobs</h1>
      <p className="text-sm text-muted mt-1">{total} total</p>

      <form className="flex gap-2 mt-5" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by title or company…"
          className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white"
        />
        <select name="status" defaultValue={status} className="px-3 py-2 rounded-lg border border-line text-sm bg-white">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-lg bg-apricot text-ink text-sm font-medium">
          Search
        </button>
      </form>

      <div className="flex flex-col gap-3 mt-5">
        {jobs.map((j: any) => {
          const skills = parseSkills(j.skills);
          const statusLabel = j.archived_at ? "Archived" : j.active ? "Active" : "Paused";
          return (
            <div key={j.id} className="p-4 rounded-xl border border-line bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-muted mt-0.5">
                    {j.company_name}
                    {!j.company_verified && (
                      <span className="ml-2 text-xs bg-ink/8 text-muted rounded-full px-1.5 py-0.5">
                        Unverified company
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    ${j.salary_min}–${j.salary_max}/mo · {j.category} · {j.employment_type} · {statusLabel}
                  </p>
                  {skills.length > 0 && (
                    <p className="text-xs text-muted mt-1 truncate">{skills.join(", ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/admin/users/${j.company_user_id}`} className="text-xs underline text-muted">
                    View company
                  </Link>
                  {statusLabel !== "Archived" && (
                    <form action={removeJobAction}>
                      <input type="hidden" name="jobId" value={j.id} />
                      <input type="hidden" name="reason" value="Removed by admin — policy violation" />
                      <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-ink/8 text-muted">
                        Remove listing
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && <p className="text-sm text-muted p-6 text-center">No jobs match this search.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-4 text-sm">
          {pageNum > 1 && (
            <Link href={`/admin/jobs?status=${status}&q=${encodeURIComponent(q)}&page=${pageNum - 1}`} className="underline text-muted">
              ← Previous
            </Link>
          )}
          <span className="text-muted">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages && (
            <Link href={`/admin/jobs?status=${status}&q=${encodeURIComponent(q)}&page=${pageNum + 1}`} className="underline text-muted">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
