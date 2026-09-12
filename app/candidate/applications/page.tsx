import { getSession } from "@/lib/auth";
import { listApplicationsForCandidate } from "@/lib/queries";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import StatusPieChart from "@/components/StatusPieChart";
import ThreadView from "@/components/ThreadView";
import MultiCheckDropdown from "@/components/MultiCheckDropdown";

const STATUSES = ["New", "Interviewing", "Offer", "Hired", "Not moving forward"];

export default async function MyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; job?: string; open?: string; show?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await requireOnboardedCandidate(session.userId);

  const { status, job, open, show } = await searchParams;
  const statuses = (status || "").split(",").filter(Boolean);
  const jobIds = (job || "").split(",").filter(Boolean);

  const allApps = await listApplicationsForCandidate(session.userId);
  const filtered = allApps.filter((a) => {
    if (statuses.length > 0 && !statuses.includes(a.status)) return false;
    if (jobIds.length > 0 && !jobIds.includes(String(a.job_id))) return false;
    return true;
  });

  const stats = STATUSES.map((s) => ({
    status: s,
    count: allApps.filter((a) => a.status === s).length,
  }));

  // Auto-updates as new applications come in, since it's just the
  // distinct set of roles this candidate has actually applied to.
  const positions = Array.from(new Map(allApps.map((a) => [a.job_id, a.job_title])).entries()).map(
    ([id, title]) => ({ value: String(id), label: title })
  );
  const openId = open ? Number(open) : null;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <h1 className="font-display font-semibold text-2xl">My applications</h1>
      <p className="text-sm text-muted mt-1 mb-4">Every role you&apos;ve messaged about, and where it stands.</p>

      <div className="mb-5">
        <StatusPieChart data={stats} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <MultiCheckDropdown
          name="status"
          label="status"
          options={STATUSES.map((s) => ({ value: s, label: s }))}
        />
        {positions.length > 1 && (
          <MultiCheckDropdown name="job" label="position" options={positions} />
        )}
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-5 border border-line rounded-xl overflow-hidden bg-white" style={{ height: "70vh" }}>
        {/* Conversation list */}
        <div className="border-r border-line overflow-y-auto">
          {filtered.map((a) => {
            const params = new URLSearchParams();
            if (status) params.set("status", status);
            if (job) params.set("job", job);
            params.set("open", String(a.id));
            return (
              <Link
                key={a.id}
                href={`/candidate/applications?${params.toString()}`}
                prefetch={false}
                className={`flex items-center gap-3 p-3 border-b border-line ${openId === a.id ? "bg-paper-dim" : "hover:bg-paper-dim/50"}`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-paper-dim relative flex-shrink-0 overflow-hidden">
                  {a.company_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.company_avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    a.company_name?.slice(0, 2).toUpperCase() || "?"
                  )}
                  {a.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-apricot border border-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{a.job_title} — {a.company_name}</div>
                  <div className="text-xs text-muted mt-0.5 flex items-center justify-between">
                    <span>{a.last_message_at ? "Active" : "No messages yet"}</span>
                    <StatusPill status={a.status} />
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-center py-10 text-muted px-3">
              {statuses.length || jobIds.length ? "Nothing matches these filters." : (
                <>No applications yet — <Link href="/candidate/jobs" className="underline">browse open roles</Link>.</>
              )}
            </p>
          )}
        </div>

        {/* Open conversation */}
        <div className="overflow-hidden">
          {openId ? (
            <ThreadView applicationId={openId} showLimit={show ? Number(show) : undefined} embedded />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted">
              Select a conversation to open it here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
