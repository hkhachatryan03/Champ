import { getSession } from "@/lib/auth";
import { listApplicationsForCompany, listJobsForCompany } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import ThreadView from "@/components/ThreadView";
import MultiCheckDropdown from "@/components/MultiCheckDropdown";

const STATUSES = ["New", "Interviewing", "Offer", "Hired", "Not moving forward"];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; job?: string; open?: string; show?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const { view, status, job, open, show } = await searchParams;
  const views = (view || "").split(",").filter(Boolean); // "unread" | "unanswered"
  const statuses = (status || "").split(",").filter(Boolean);
  const jobIds = (job || "").split(",").filter(Boolean);

  const all = await listApplicationsForCompany(session.userId);
  const filtered = all.filter((a) => {
    if (views.length > 0) {
      const matchesUnread = views.includes("unread") && a.unread_count > 0;
      const matchesUnanswered = views.includes("unanswered") && a.company_reply_count === 0;
      if (!matchesUnread && !matchesUnanswered) return false;
    }
    if (statuses.length > 0 && !statuses.includes(a.status)) return false;
    if (jobIds.length > 0 && !jobIds.includes(String(a.job_id))) return false;
    return true;
  });

  const myActiveJobs = await listJobsForCompany(session.userId);
  const positions = myActiveJobs.filter((j) => j.active).map((j) => ({ value: String(j.id), label: j.title }));
  const openId = open ? Number(open) : null;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <h1 className="font-display font-semibold text-2xl">Inbox</h1>

      <div className="flex flex-wrap items-center gap-2 mt-4 mb-5">
        <MultiCheckDropdown
          name="view"
          label="type"
          options={[
            { value: "unread", label: "Unread" },
            { value: "unanswered", label: "Unanswered" },
          ]}
        />
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
            if (view) params.set("view", view);
            if (status) params.set("status", status);
            if (job) params.set("job", job);
            params.set("open", String(a.id));
            return (
              <Link
                key={a.id}
                href={`/company/inbox?${params.toString()}`}
                prefetch={false}
                className={`flex items-center gap-3 p-3 border-b border-line ${openId === a.id ? "bg-paper-dim" : "hover:bg-paper-dim/50"}`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-paper-dim relative flex-shrink-0 overflow-hidden">
                  {a.candidate_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.candidate_avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    a.candidate_name?.slice(0, 2).toUpperCase() || "?"
                  )}
                  {a.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-apricot border border-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{a.candidate_name} — {a.job_title}</div>
                  <div className="text-xs text-muted mt-0.5 flex items-center justify-between">
                    <span>{a.company_reply_count === 0 ? "Not yet answered" : "Replied"}</span>
                    <StatusPill status={a.status} />
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-center py-10 text-muted px-3">Nothing here.</p>}
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
