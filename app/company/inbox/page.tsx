import { getSession } from "@/lib/auth";
import { listApplicationsForCompany } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import ThreadView from "@/components/ThreadView";

const STATUSES = ["New", "Interviewing", "Offer", "Hired", "Not moving forward"];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; job?: string; open?: string; show?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const { tab = "all", status, job, open, show } = await searchParams;
  const all = await listApplicationsForCompany(session.userId);
  const filtered = all.filter((a) => {
    if (tab === "unread" && a.unread_count === 0) return false;
    if (tab === "unanswered" && a.company_reply_count > 0) return false;
    if (status && a.status !== status) return false;
    if (job && String(a.job_id) !== job) return false;
    return true;
  });

  const positions = Array.from(new Map(all.map((a) => [a.job_id, a.job_title])).entries());
  const openId = open ? Number(open) : null;

  const tabs = [
    ["all", "All"],
    ["unread", "Unread"],
    ["unanswered", "Unanswered"],
  ];

  const qs = (overrides: { tab?: string; status?: string; job?: string; open?: string }) => {
    const params = new URLSearchParams();
    params.set("tab", overrides.tab ?? tab);
    const s = "status" in overrides ? overrides.status : status;
    if (s) params.set("status", s);
    const j = "job" in overrides ? overrides.job : job;
    if (j) params.set("job", j);
    const o = "open" in overrides ? overrides.open : open;
    if (o) params.set("open", o);
    return `/company/inbox?${params.toString()}`;
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <h1 className="font-display font-semibold text-2xl">Inbox</h1>
      <div className="flex gap-2 mt-4 mb-3">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={qs({ tab: key })}
            className={`text-sm px-3.5 py-1.5 rounded-full font-medium ${
              tab === key ? "bg-ink text-paper" : "bg-paper-dim"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <Link
          href={qs({ status: undefined })}
          className={`text-xs px-3 py-1 rounded-full font-medium ${!status ? "bg-ink/80 text-paper" : "bg-paper-dim text-muted"}`}
        >
          Any status
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={qs({ status: s })}
            className={`text-xs px-3 py-1 rounded-full font-medium ${status === s ? "bg-ink/80 text-paper" : "bg-paper-dim text-muted"}`}
          >
            {s}
          </Link>
        ))}
      </div>
      {positions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <Link
            href={qs({ job: undefined })}
            className={`text-xs px-3 py-1 rounded-full font-medium ${!job ? "bg-ink/80 text-paper" : "bg-paper-dim text-muted"}`}
          >
            Any position
          </Link>
          {positions.map(([id, title]) => (
            <Link
              key={id}
              href={qs({ job: String(id) })}
              className={`text-xs px-3 py-1 rounded-full font-medium ${job === String(id) ? "bg-ink/80 text-paper" : "bg-paper-dim text-muted"}`}
            >
              {title}
            </Link>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-[320px_1fr] gap-5 border border-line rounded-xl overflow-hidden bg-white" style={{ height: "70vh" }}>
        {/* Conversation list */}
        <div className="border-r border-line overflow-y-auto">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={qs({ open: String(a.id) })}
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
          ))}
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
