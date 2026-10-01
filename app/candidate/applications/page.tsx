import { getSession } from "@/lib/auth";
import { listApplicationsForCandidate } from "@/lib/queries";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import StatusPieChart from "@/components/StatusPieChart";
import ThreadView from "@/components/ThreadView";
import MultiCheckDropdown from "@/components/MultiCheckDropdown";
import GuestPage from "@/components/GuestPage";
import { ArrowLeft } from "lucide-react";

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

  // Same filters, minus the open conversation — used by the phone "back to list" link.
  const listParams = new URLSearchParams();
  if (status) listParams.set("status", status);
  if (job) listParams.set("job", job);
  const listHref = `/candidate/applications${listParams.toString() ? `?${listParams.toString()}` : ""}`;

  return (
    <GuestPage>
      <div className={`aur-ap ${openId ? "aur-ap-open" : ""}`} {...(openId ? { "data-chat-open": "" } : {})}>
        {/* On phones an open chat takes the whole screen, so the title and overview step aside. */}
        <div className={`aur-hero-in relative z-20 flex flex-wrap items-end justify-between gap-x-6 gap-y-3.5 flex-shrink-0 ${openId ? "max-md:hidden" : ""}`}>
          <div>
            <h1 className="font-display font-semibold text-[clamp(30px,4vw,38px)] leading-[1.1] text-paper">My applications</h1>
            <p className="text-sm text-paper/58 mt-1.5">Every role you&apos;ve messaged about, and where it stands.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
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

        <div className={`aur-hero-in mt-3.5 flex-shrink-0 ${openId ? "max-md:hidden" : ""}`} style={{ animationDelay: ".1s" }}>
          <StatusPieChart glass data={stats} />
        </div>

        <div className={`aur-ap-fill aur-hero-in ${openId ? "max-md:mt-0 mt-3.5" : "mt-3.5"}`} style={{ animationDelay: ".18s" }}>
          <div className="aur-bezel">
            <div className="aur-bezel-inner">
              <div className="aur-inbox">
                {/* Conversation list */}
                <div className={`aur-inbox-list ${openId ? "max-md:hidden" : ""}`}>
                  {filtered.map((a) => {
                    const params = new URLSearchParams();
                    if (status) params.set("status", status);
                    if (job) params.set("job", job);
                    params.set("open", String(a.id));
                    const selected = openId === a.id;
                    return (
                      <Link
                        key={a.id}
                        href={`/candidate/applications?${params.toString()}`}
                        prefetch={false}
                        className={`relative flex items-center gap-3 px-4 py-3.5 border-b border-paper/10 transition-colors duration-300 ${selected ? "bg-apricot/[.08]" : "hover:bg-paper/[.04]"}`}
                      >
                        {selected && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-[3px] bg-apricot" />}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-[15px] text-apricot bg-ink/70 border border-paper/15 relative flex-shrink-0">
                          <span className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                            {a.company_avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={a.company_avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              a.company_name?.charAt(0).toUpperCase() || "?"
                            )}
                          </span>
                          {a.unread_count > 0 && (
                            <span className="absolute -top-px -right-px w-[11px] h-[11px] rounded-full bg-apricot border-2 border-[#1d2026]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-medium text-paper truncate">{a.job_title} — {a.company_name}</div>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs text-paper/45">{a.last_message_at ? "Active" : "No messages yet"}</span>
                            <StatusPill glass status={a.status} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {filtered.length === 0 && (
                    <p className="text-[13.5px] leading-[1.6] text-center py-10 text-paper/55 px-4">
                      {statuses.length || jobIds.length ? "Nothing matches these filters." : (
                        <>No applications yet — <Link href="/candidate/jobs" className="underline underline-offset-[3px] text-apricot">browse open roles</Link>.</>
                      )}
                    </p>
                  )}
                </div>

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
