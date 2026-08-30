import { getSession } from "@/lib/auth";
import {
  getApplicationContext,
  listMessages,
  countMessages,
  sendMessage,
  markMessagesRead,
  updateApplicationStatus,
  updateInviteStatus,
  closeJobForApplication,
  editMessage,
  deleteMessage,
  toggleReaction,
  listReactionsForApplication,
} from "@/lib/queries";
import { formatLastActive } from "@/lib/dates";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { StatusPill } from "@/components/ui";
import { put } from "@vercel/blob";
import MessageComposer from "@/components/MessageComposer";
import MessageBubble from "@/components/MessageBubble";
import AutoScrollMessages from "@/components/AutoScrollMessages";

async function editMessageAction(applicationId: number, messageId: number, newBody: string) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");
  await editMessage(messageId, session.role, newBody);
  revalidatePath(`/thread/${applicationId}`);
  revalidatePath("/company/inbox");
}

async function deleteMessageAction(applicationId: number, messageId: number) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");
  await deleteMessage(messageId, session.role);
  revalidatePath(`/thread/${applicationId}`);
  revalidatePath("/company/inbox");
}

async function reactAction(applicationId: number, messageId: number, emoji: string) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");
  await toggleReaction(messageId, session.role, emoji);
  revalidatePath(`/thread/${applicationId}`);
  revalidatePath("/company/inbox");
}

async function sendAction(prevCount: number, formData: FormData): Promise<number> {
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

  if (!body && !attachment) return prevCount;
  await sendMessage(applicationId, session.role, body, attachment);
  revalidatePath(`/thread/${applicationId}`);
  revalidatePath("/candidate/applications");
  revalidatePath("/company/inbox");
  revalidatePath("/");
  return prevCount + 1;
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

export default async function ThreadView({
  applicationId,
  showLimit,
  embedded = false,
}: {
  applicationId: number;
  showLimit?: number;
  embedded?: boolean;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const app = await getApplicationContext(applicationId);

  if (!app) {
    return <div className="px-6 py-10 text-sm text-muted">Conversation not found.</div>;
  }

  const isCandidate = session.role === "candidate" && session.userId === app.candidate_user_id;
  const isCompany = session.role === "company" && session.userId === app.company_user_id;
  if (!isCandidate && !isCompany) {
    return <div className="px-6 py-10 text-sm text-muted">You don&apos;t have access to this conversation.</div>;
  }

  await markMessagesRead(applicationId, session.role);
  const limit = showLimit || 30;
  const [messages, totalMessages] = await Promise.all([
    listMessages(applicationId, limit),
    countMessages(applicationId),
  ]);
  const hasMoreOlder = totalMessages > messages.length;
  const allReactions = await listReactionsForApplication(applicationId);

  const backHref = isCandidate ? "/candidate/applications" : "/company/inbox";
  const loadMoreHref = embedded ? `/company/inbox?open=${applicationId}&show=${limit + 30}` : `/thread/${applicationId}?show=${limit + 30}`;

  return (
    <div className={`flex flex-col ${embedded ? "h-full" : "px-6 py-8 max-w-xl mx-auto"}`} style={embedded ? undefined : { minHeight: "70vh" }}>
      {!embedded && (
        <Link href={backHref} prefetch={false} className="text-sm text-muted mb-4">← Back</Link>
      )}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          {(isCandidate ? app.company_avatar_url : app.candidate_avatar_url) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={isCandidate ? app.company_avatar_url : app.candidate_avatar_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          )}
          <div>
            {isCandidate ? (
              <Link href={`/companies/${app.company_user_id}`} className="font-display font-semibold text-xl hover:underline">
                {app.company_name}
              </Link>
            ) : (
              <h1 className="font-display font-semibold text-xl">{app.candidate_name}</h1>
            )}
            <p className="text-xs text-muted -mt-0.5">
              {isCandidate && app.recruiter_name ? `${app.recruiter_name} · ` : ""}
              <Link href={isCompany ? `/company/jobs/${app.job_id}` : `/candidate/jobs/${app.job_id}`} className="hover:underline">
                {app.job_title}
              </Link>
            </p>
            <p className="text-xs text-moss mt-0.5">
              {formatLastActive(isCandidate ? app.company_last_seen_at : app.candidate_last_seen_at)}
            </p>
          {isCompany && (
            <Link href={`/company/candidates/${app.candidate_user_id}`} className="text-xs underline text-apricot-deep">
              View full profile →
            </Link>
          )}
          </div>
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

      <div className="px-4">
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
      </div>

      <div className="flex-1 mt-4 px-4 overflow-y-auto flex flex-col gap-3 pr-1">
        <AutoScrollMessages watchKey={`${applicationId}-${messages.length}`}>
          {hasMoreOlder && (
            <Link
              href={loadMoreHref}
              prefetch={false}
              className="text-xs text-center underline text-apricot-deep py-1 block"
            >
              Load earlier messages
            </Link>
          )}
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              mine={m.sender_role === session.role}
              applicationId={applicationId}
              reactions={allReactions.filter((r) => r.message_id === m.id)}
              onEdit={editMessageAction}
              onDelete={deleteMessageAction}
              onReact={reactAction}
            />
          ))}
          {messages.length === 0 && <p className="text-sm text-muted">No messages yet — say hello.</p>}
        </AutoScrollMessages>
      </div>

      <div className="px-4 pb-4">
        <MessageComposer applicationId={applicationId} action={sendAction} />
      </div>
    </div>
  );
}
