import Link from "next/link";
import { listApplicationsAdmin, countApplicationsAdmin } from "@/lib/adminQueries";

const PAGE_SIZE = 30;
const STATUSES = ["New", "Interviewing", "Offer", "Hired", "Not moving forward"];

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const [apps, total] = await Promise.all([
    listApplicationsAdmin({ status, limit: PAGE_SIZE, offset }),
    countApplicationsAdmin({ status }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Applications</h1>
      <p className="text-sm text-muted mt-1">{total} total — includes chat activity per thread</p>

      <div className="flex gap-2 mt-5 flex-wrap">
        <Link
          href="/admin/applications"
          className={`text-xs px-3 py-1.5 rounded-full ${status === "" ? "bg-ink text-paper" : "bg-white border border-line"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/applications?status=${encodeURIComponent(s)}`}
            className={`text-xs px-3 py-1.5 rounded-full ${status === s ? "bg-ink text-paper" : "bg-white border border-line"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-line bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Messages</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a: any) => (
              <tr key={a.id} className="border-b border-line last:border-0 hover:bg-paper-dim">
                <td className="px-4 py-3 font-medium">{a.candidate_name}</td>
                <td className="px-4 py-3">{a.job_title}</td>
                <td className="px-4 py-3 text-muted">{a.company_name}</td>
                <td className="px-4 py-3">{a.status}</td>
                <td className="px-4 py-3 text-muted">{a.message_count}</td>
                <td className="px-4 py-3 text-muted">{a.updated_at?.slice(0, 10)}</td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No applications match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-4 text-sm">
          {pageNum > 1 && (
            <Link href={`/admin/applications?status=${encodeURIComponent(status)}&page=${pageNum - 1}`} className="underline text-muted">
              ← Previous
            </Link>
          )}
          <span className="text-muted">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages && (
            <Link href={`/admin/applications?status=${encodeURIComponent(status)}&page=${pageNum + 1}`} className="underline text-muted">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
