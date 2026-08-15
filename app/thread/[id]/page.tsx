import { getSession } from "@/lib/auth";
import { getApplicationContext, listMessages, sendMessage, markMessagesRead, updateApplicationStatus } from "@/lib/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui";

async function sendAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");
  const applicationId = Number(formData.get("applicationId"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  await sendMessage(applicationId, session.role, body);
}

async function statusAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const applicationId = Number(formData.get("applicationId"));
  const status = String(formData.get("status") || "New");
  await updateApplicationStatus(applicationId, status);
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const applicationId = Number(id);
  const app = await getApplicationContext(applicationId);

  if (!app) {
    return <div className="px-6 py-10 max-w-xl mx-auto text-sm text-muted">Conversation not found.</div>;
  }

  const isCandidate = session.role === "candidate" && session.userId === app.candidate_user_id;
  const isCompany = session.role === "company" && session.userId === app.company_user_id;
  if (!isCandidate && !isCompany) {
    return <div className="px-6 py-10 max-w-xl mx-auto text-sm text-muted">You don&apos;t have access to this conversation.</div>;
  }

  await markMessagesRead(applicationId, session.role);
  const messages = await listMessages(applicationId);

  const backHref = isCandidate ? "/candidate/applications" : "/company/inbox";
  const otherName = isCandidate ? app.company_name : app.candidate_name;

  return (
    <div className="px-6 py-8 max-w-xl mx-auto flex flex-col" style={{ minHeight: "70vh" }}>
      <Link href={backHref} className="text-sm text-muted mb-4">← Back</Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-xl">{otherName}</h1>
          <p className="text-sm text-muted">{app.job_title}</p>
          {isCompany && (
            <Link href={`/company/candidates/${app.candidate_user_id}`} className="text-xs underline text-apricot-deep">
              View full profile →
            </Link>
          )}
        </div>
        {isCompany && (
          <form action={statusAction} className="flex items-center gap-2">
            <input type="hidden" name="applicationId" value={applicationId} />
            <select
              name="status"
              defaultValue={app.status}
              className="text-xs px-2.5 py-1.5 rounded-full border border-line bg-white"
            >
              <option>New</option>
              <option>Interviewing</option>
              <option>Offer</option>
              <option>Not moving forward</option>
            </select>
            <button type="submit" className="text-xs px-2.5 py-1.5 rounded-full bg-ink text-paper">
              Update
            </button>
          </form>
        )}
        {isCandidate && <StatusPill status={app.status} />}
      </div>

      {(app.cv_filename || app.expected_salary) && (
        <div className="mt-3 p-3 rounded-lg bg-paper-dim flex flex-wrap items-center gap-3 text-sm">
          {app.cv_filename && (
            <a
              href={app.cv_filename}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-apricot-deep"
            >
              📎 View CV
            </a>
          )}
          {app.expected_salary && (
            <span className="font-mono-num text-apricot-deep">
              💰 ${app.expected_salary}/mo asked
            </span>
          )}
        </div>
      )}

      <div className="flex-1 mt-4 overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.map((m) => {
          const mine = m.sender_role === session.role;
          return (
            <div key={m.id} className="flex flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm whitespace-pre-line ${mine ? "bg-apricot" : "bg-paper-dim"}`}>
                {m.body}
              </div>
              {mine && (
                <span className="text-[10px] mt-0.5 text-muted">
                  {m.read_at ? "Read" : "Sent"} · {m.created_at}
                </span>
              )}
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-sm text-muted">No messages yet — say hello.</p>}
      </div>

      <form action={sendAction} className="mt-4 flex items-center gap-2">
        <input type="hidden" name="applicationId" value={applicationId} />
        <input
          name="body"
          placeholder="Write a message…"
          required
          className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none"
        />
        <button type="submit" className="px-4 py-2.5 rounded-lg bg-apricot text-ink text-sm font-medium">
          Send
        </button>
      </form>
    </div>
  );
}
