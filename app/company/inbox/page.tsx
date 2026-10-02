import { getSession } from "@/lib/auth";
import { listApplicationsForCompany, listJobsForCompany } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import ThreadView from "@/components/ThreadView";
import MultiCheckDropdown from "@/components/MultiCheckDropdown";
import GuestPage from "@/components/GuestPage";
import { ArrowLeft } from "lucide-react";
import RefreshAfterOpen from "@/components/RefreshAfterOpen";

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

  // Same filters, minus the open conversation — used by the phone "back to list" link.
  const listParams = new URLSearchParams();
  if (view) listParams.set("view", view);
  if (status) listParams.set("status", status);
  if (job) listParams.set("job", job);
  const listHref = `/company/inbox${listParams.toString() ? `?${listParams.toString()}` : ""}`;

  return (
    <GuestPage>
      <div className={`aur-ap ${openId ? "aur-ap-open" : ""}`} {...(openId ? { "data-chat-open": "" } : {})}>
        {/* On phones an open chat takes the whole screen, so the title and filters step aside. */}
        <div className={`aur-hero-in relative z-20 flex flex-wrap items-end justify-between gap-x-6 gap-y-3.5 flex-shrink-0 ${openId ? "max-md:hidden" : ""}`}>
          <div>
            <h1 className="font-display font-semibold text-[clamp(30px,4vw,38px)] leading-[1.1] text-paper">Inbox</h1>
            <p className="text-sm text-paper/58 mt-1.5">Conversations with candidates, and where each one stands.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <MultiCheckDropdown
              glass
              name="view"
              label="type"
              options={[
                { value: "unread", label: "Unread" },
                { value: "unanswered", label: "Unanswered" },
              ]}
            />
            <MultiCheckDropdown
              glass
              name="status"
              label="status"
              options={STATUSES.map((s) => ({ value: s, label: s }))}
            />
            {positions.length > 1 && (
              <MultiCheckDropdown glass name="job" label="position" options={positions} />
            )}
          </div>
        </div>

        {/* Breathing room between the filters and the chat panel */}
        <div className={`aur-ap-fill aur-hero-in ${openId ? "max-md:mt-0 mt-[22px]" : "mt-[22px]"}`} style={{ animationDelay: ".12s" }}>
          <div className="aur-bezel">
            <div className="aur-bezel-inner">
              <div className="aur-inbox">
                {/* Conversation list */}
                <div className={`aur-inbox-list ${openId ? "max-md:hidden" : ""}`}>
                  {filtered.map((a) => {
                    const params = new URLSearchParams();
                    if (view) params.set("view", view);
                    if (status) params.set("status", status);
                    if (job) params.set("job", job);
                    params.set("open", String(a.id));
                    const selected = openId === a.id;
                    return (
                      <Link
                        key={a.id}
                        href={`/company/inbox?${params.toString()}`}
                        prefetch={false}
                        className={`relative flex items-center gap-3 px-4 py-3.5 border-b border-paper/10 transition-colors duration-300 ${selected ? "bg-apricot/[.08]" : "hover:bg-paper/[.04]"}`}
                      >
                        {selected && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-[3px] bg-apricot" />}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-[15px] text-apricot bg-ink/70 border border-paper/15 relative flex-shrink-0">
                          <span className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                            {a.candidate_avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={a.candidate_avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              a.candidate_name?.charAt(0).toUpperCase() || "?"
                            )}
                          </span>
                          {a.unread_count > 0 && openId !== a.id && (
                            <span className="absolute -top-px -right-px w-[11px] h-[11px] rounded-full bg-apricot border-2 border-[#1d2026]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-medium text-paper truncate">{a.candidate_name} — {a.job_title}</div>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs text-paper/45">{a.company_reply_count === 0 ? "Not yet answered" : "Replied"}</span>
                            <StatusPill glass status={a.status} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {filtered.length === 0 && <p className="text-[13.5px] text-center py-10 text-paper/55 px-4">Nothing here.</p>}
                </div>

                {openId && (filtered.find((a) => a.id === openId)?.unread_count ?? 0) > 0 && <RefreshAfterOpen />}
                {/* Open conversation */}
                <div className={`aur-inbox-pane ${openId ? "max-md:flex-1" : "max-md:hidden"}`}>
                  {openId ? (
                    <>
                      <Link
                        href={listHref}
                        prefetch={false}
                        className="md:hidden inline-flex items-center gap-2 px-[18px] pt-3 text-[13px] text-paper/70 flex-shrink-0"
                      >
                        <ArrowLeft size={15} strokeWidth={1.25} /> All conversations
                      </Link>
                      <ThreadView glass applicationId={openId} showLimit={show ? Number(show) : undefined} embedded />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-paper/50">
                      Select a conversation to open it here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestPage>
  );
}
