import { getSession } from "@/lib/auth";
import { listApplicationsForCandidate } from "@/lib/queries";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import StatusPieChart from "@/components/StatusPieChart";

const STATUSES = ["New", "Interviewing", "Offer", "Hired", "Not moving forward"];

export default async function MyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await requireOnboardedCandidate(session.userId);

  const { status } = await searchParams;
  const allApps = await listApplicationsForCandidate(session.userId);
  const apps = status ? allApps.filter((a) => a.status === status) : allApps;

  const stats = STATUSES.map((s) => ({
    status: s,
    count: allApps.filter((a) => a.status === s).length,
  }));

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <h1 className="font-display font-semibold text-2xl">My applications</h1>
      <p className="text-sm text-muted mt-1 mb-6">Every role you&apos;ve messaged about, and where it stands.</p>

      <StatusPieChart data={stats} />

      <div className="flex flex-wrap gap-2 mb-5">
        <Link
          href="/candidate/applications"
          className={`text-sm px-3.5 py-1.5 rounded-full font-medium ${!status ? "bg-ink text-paper" : "bg-paper-dim"}`}
        >
          All ({allApps.length})
        </Link>
        {STATUSES.map((s) => {
          const count = allApps.filter((a) => a.status === s).length;
          return (
            <Link
              key={s}
              href={`/candidate/applications?status=${encodeURIComponent(s)}`}
              className={`text-sm px-3.5 py-1.5 rounded-full font-medium ${status === s ? "bg-ink text-paper" : "bg-paper-dim"}`}
            >
              {s} ({count})
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {apps.map((a) => (
          <div key={a.id} className="p-4 rounded-xl border border-line bg-white flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/candidate/jobs/${a.job_id}`} className="font-display font-semibold text-base hover:underline">
                {a.job_title}
              </Link>
              <div className="text-xs text-muted mt-0.5">
                <Link href={`/companies/${a.company_user_id}`} className="hover:underline">
                  {a.company_name}
                </Link>
                {a.recruiter_name && ` · with ${a.recruiter_name}`}
                {" · last activity "}{a.last_message_at || a.created_at}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                {a.unread_count > 0 && <span className="w-2 h-2 rounded-full bg-apricot" />}
                <StatusPill status={a.status} />
              </div>
              <Link href={`/thread/${a.id}`} prefetch={false} className="text-xs underline text-apricot-deep whitespace-nowrap">
                Open chat
              </Link>
            </div>
          </div>
        ))}
        {apps.length === 0 && (
          <p className="text-sm text-center py-10 text-muted">
            {status ? `No applications with status "${status}".` : (
              <>No applications yet — <Link href="/candidate/jobs" className="underline">browse open roles</Link>.</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
