import { getSession } from "@/lib/auth";
import {
  getApplicationContext,
  listMessages,
  sendMessage,
  markMessagesRead,
  updateApplicationStatus,
  updateInviteStatus,
  closeJobForApplication,
} from "@/lib/queries";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import { put } from "@vercel/blob";
import FormattedMessage from "@/components/FormattedMessage";
import MessageComposer from "@/components/MessageComposer";

async function sendAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");
  const applicationId = Number(formData.get("applicationId"));
  const body = String(formData.get("body") || "").trim();

  let attachment: { url: string; name: string } | null = null;
  const file = formData.get("attachment") as File | null;
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = `chat/${applicationId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const blob = await put(safeName, buffer, { access: "public", contentType: file.type || "application/octet-stream" });
      attachment = { url: blob.url, name: file.name };
    } catch (err) {
      console.error("Blob upload failed (chat attachment):", err);
    }
  }

  if (!body && !attachment) return;
  await sendMessage(applicationId, session.role, body, attachment);
  revalidatePath(`/thread/${applicationId}`);
  revalidatePath("/candidate/applications");
  revalidatePath("/company/inbox");
  revalidatePath("/");
}

async function statusAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const applicationId = Number(formData.get("applicationId"));
  const status = String(formData.get("status") || "New");
  await updateApplicationStatus(applicationId, status);

  // A quick, honest auto-message so the candidate isn't left guessing —
  // the company can still say more themselves right after.
  if (status === "Offer") {
    await sendMessage(applicationId, "company", "🎉 Congratulations — we'd like to move forward with an offer for this role!");
  } else if (status === "Not moving forward") {
    await sendMessage(applicationId, "company", "Thank you for your interest — we've decided not to move forward with your application at this time.");
  } else if (status === "Hired") {
    await sendMessage(applicationId, "company", "🎉 Welcome aboard! We're marking this role as filled.");
    await closeJobForApplication(applicationId);
  }

  revalidatePath(`/thread/${applicationId}`);
  revalidatePath("/candidate/applications");
  revalidatePath("/company/inbox");
  revalidatePath("/company/dashboard");
}

async function respondToInviteAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const applicationId = Number(formData.get("applicationId"));
  const response = String(formData.get("response") || "");

  if (response === "accepted") {
    await updateInviteStatus(applicationId, "accepted");
    await sendMessage(applicationId, "candidate", "I'm interested — happy to chat!");
  } else {
    await updateInviteStatus(applicationId, "declined");
    await sendMessage(applicationId, "candidate", "Thanks for reaching out, but I'm not looking to move right now.");
  }

  revalidatePath(`/thread/${applicationId}`);
  revalidatePath("/candidate/applications");
  revalidatePath("/company/inbox");
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

  return (
    <div className="px-6 py-8 max-w-xl mx-auto flex flex-col" style={{ minHeight: "70vh" }}>
      <Link href={backHref} prefetch={false} className="text-sm text-muted mb-4">← Back</Link>
      <div className="flex items-center justify-between">
        <div>
          {isCandidate ? (
            <Link href={`/companies/${app.company_user_id}`} className="font-display font-semibold text-xl hover:underline">
              {app.company_name}
            </Link>
          ) : (
            <h1 className="font-display font-semibold text-xl">{app.candidate_name}</h1>
          )}
          <Link href={isCompany ? `/company/jobs/${app.job_id}` : `/candidate/jobs/${app.job_id}`} className="text-sm text-muted hover:underline block">
            {app.job_title}
          </Link>
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
              key={app.status}
              name="status"
              defaultValue={app.status}
              className="text-xs px-2.5 py-1.5 rounded-full border border-line bg-white"
            >
              <option>New</option>
              <option>Interviewing</option>
              <option>Offer</option>
              <option>Hired</option>
              <option>Not moving forward</option>
            </select>
            <button type="submit" className="text-xs px-2.5 py-1.5 rounded-full bg-ink text-paper">
              Update
            </button>
          </form>
        )}
        {isCandidate && <StatusPill status={app.status} />}
      </div>

      {(() => {
        // Prefer the candidate's live CV — if they added one after applying
        // with just a LinkedIn link, this makes sure it actually shows up
        // instead of staying frozen at whatever they had at apply time.
        const effectiveCv = app.candidate_cv_filename || app.cv_filename;
        return (effectiveCv || app.expected_salary || app.candidate_linkedin_url) && (
          <div className="mt-3 p-3 rounded-lg bg-paper-dim flex flex-wrap items-center gap-3 text-sm">
            {effectiveCv && (
              <a href={effectiveCv} target="_blank" rel="noopener noreferrer" className="underline text-apricot-deep">
                📎 View CV
              </a>
            )}
            {app.candidate_linkedin_url && isCompany && (
              <a
                href={app.candidate_linkedin_url.startsWith("http") ? app.candidate_linkedin_url : `https://${app.candidate_linkedin_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-apricot-deep"
              >
                🔗 LinkedIn
              </a>
            )}
            {app.expected_salary && (
              <span className="font-mono-num text-apricot-deep">💰 ${app.expected_salary}/mo asked</span>
            )}
          </div>
        );
      })()}

      {isCandidate && app.invite_status === "pending" && (
        <div className="mt-3 p-4 rounded-lg border border-line bg-white">
          <p className="text-sm font-medium mb-1">{app.company_name} invited you to this role</p>
          <p className="text-xs text-muted mb-3">
            Take a look at the role details above, then let them know if you&apos;re interested —
            either way, you can keep chatting regardless.
          </p>
          <div className="flex gap-2">
            <form action={respondToInviteAction}>
              <input type="hidden" name="applicationId" value={applicationId} />
              <input type="hidden" name="response" value="accepted" />
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-apricot text-ink">
                I&apos;m interested
              </button>
            </form>
            <form action={respondToInviteAction}>
              <input type="hidden" name="applicationId" value={applicationId} />
              <input type="hidden" name="response" value="declined" />
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium border border-line">
                Not right now
              </button>
            </form>
          </div>
        </div>
      )}
      {isCompany && app.invite_status && (
        <p className="text-xs text-muted mt-2">
          Invite status: <span className="font-medium">{app.invite_status}</span>
        </p>
      )}

      <div className="flex-1 mt-4 overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.map((m) => {
          const mine = m.sender_role === session.role;
          return (
            <div key={m.id} className="flex flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${mine ? "bg-apricot" : "bg-paper-dim"}`}>
                {m.body && <FormattedMessage body={m.body} />}
                {m.attachment_url && (
                  <a
                    href={m.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 text-xs underline ${m.body ? "mt-1.5" : ""} ${mine ? "text-ink" : "text-apricot-deep"}`}
                  >
                    📎 {m.attachment_name || "Attachment"}
                  </a>
                )}
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

      <MessageComposer applicationId={applicationId} action={sendAction} />
    </div>
  );
}
