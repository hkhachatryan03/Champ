import { getSession } from "@/lib/auth";
import { listApplicationsForCompany } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";

const STATUSES = ["New", "Interviewing", "Offer", "Hired", "Not moving forward"];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);

  const { tab = "all", status } = await searchParams;
  const all = await listApplicationsForCompany(session.userId);
  const filtered = all.filter((a) => {
    if (tab === "unread" && a.unread_count === 0) return false;
    if (tab === "unanswered" && a.company_reply_count > 0) return false;
    if (status && a.status !== status) return false;
    return true;
  });

  const tabs = [
    ["all", "All"],
    ["unread", "Unread"],
    ["unanswered", "Unanswered"],
  ];

  const qs = (overrides: { tab?: string; status?: string }) => {
    const params = new URLSearchParams();
    params.set("tab", overrides.tab ?? tab);
    const s = "status" in overrides ? overrides.status : status;
    if (s) params.set("status", s);
    return `/company/inbox?${params.toString()}`;
  };

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
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
      <div className="flex flex-wrap gap-2 mb-5">
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
      <div className="flex flex-col gap-3">
        {filtered.map((a) => (
          <Link key={a.id} href={`/thread/${a.id}`} prefetch={false} className="p-4 rounded-xl border border-line bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-paper-dim relative">
                {a.candidate_name?.slice(0, 2).toUpperCase() || "?"}
                {a.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-apricot" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium">{a.candidate_name} — {a.job_title}</div>
                <div className="text-xs text-muted mt-0.5">
                  {a.company_reply_count === 0 ? "Not yet answered" : "Replied"}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusPill status={a.status} />
              <span className="text-xs text-muted whitespace-nowrap">{a.updated_at}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-sm text-center py-10 text-muted">Nothing here.</p>}
      </div>
    </div>
  );
}
