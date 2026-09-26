import { redirect } from "next/navigation";
import {
  listContactMessages,
  replyToContactMessage,
  resolveContactMessage,
  reopenContactMessage,
} from "@/lib/adminQueries";
import { getAdminSession } from "@/lib/adminAuth";
import { sendContactReplyEmail } from "@/lib/email";

async function replyAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const id = Number(formData.get("id"));
  const email = String(formData.get("email") || "");
  const originalBody = String(formData.get("originalBody") || "");
  const reply = String(formData.get("reply") || "").trim();
  if (!reply) redirect("/admin/support");

  await replyToContactMessage(id, reply, session!.email);
  if (email) {
    await sendContactReplyEmail(email, originalBody, reply);
  }
  redirect("/admin/support");
}

async function resolveAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  await resolveContactMessage(Number(formData.get("id")), session!.email);
  redirect("/admin/support");
}

async function reopenAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  await reopenContactMessage(Number(formData.get("id")), session!.email);
  redirect("/admin/support?view=resolved");
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "open" } = await searchParams;
  const status = view === "resolved" ? "resolved" : "open";
  const messages = await listContactMessages(status as "open" | "resolved");
  const hasEmail = !!process.env.RESEND_API_KEY;

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Support</h1>
      <p className="text-sm text-muted mt-1">Contact Us submissions from candidates, companies, and guests.</p>
      {!hasEmail && (
        <p className="text-xs text-muted mt-2 p-3 rounded-lg bg-paper-dim">
          RESEND_API_KEY isn&apos;t set on this deployment — replies will be saved here but won&apos;t actually
          email the person yet.
        </p>
      )}

      <div className="flex gap-2 mt-5">
        <a
          href="/admin/support?view=open"
          className={`text-xs px-3 py-1.5 rounded-full ${status === "open" ? "bg-ink text-paper" : "bg-white border border-line"}`}
        >
          Open
        </a>
        <a
          href="/admin/support?view=resolved"
          className={`text-xs px-3 py-1.5 rounded-full ${status === "resolved" ? "bg-ink text-paper" : "bg-white border border-line"}`}
        >
          Resolved
        </a>
      </div>

      <div className="flex flex-col gap-3 mt-5">
        {messages.map((m: any) => (
          <div key={m.id} className="p-5 rounded-xl border border-line bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{m.email || "(no email given)"}</p>
                {m.topic && <p className="text-xs text-muted mt-0.5">Topic: {m.topic}</p>}
                <p className="text-xs text-muted mt-0.5">{m.created_at?.slice(0, 16).replace("T", " ")}</p>
              </div>
              {status === "resolved" && (
                <form action={reopenAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-xs underline text-muted whitespace-nowrap">
                    Reopen
                  </button>
                </form>
              )}
            </div>
            <p className="text-sm mt-3 whitespace-pre-wrap">{m.body}</p>
            {m.attachment_url && (
              <a href={m.attachment_url} target="_blank" className="text-xs underline text-muted mt-2 inline-block">
                View attachment
              </a>
            )}

            {m.admin_reply && (
              <div className="mt-3 p-3 rounded-lg bg-moss/10">
                <p className="text-xs text-muted">Replied by {m.replied_by} on {m.replied_at?.slice(0, 10)}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{m.admin_reply}</p>
              </div>
            )}

            {status === "open" && (
              <div className="mt-4 flex flex-col gap-2">
                <form action={replyAction} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="email" value={m.email || ""} />
                  <input type="hidden" name="originalBody" value={m.body} />
                  <textarea
                    name="reply"
                    placeholder={m.email ? "Write a reply — this will be emailed to them…" : "Write a reply (no email on file, so this just saves as an internal note)…"}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-apricot text-ink font-medium">
                      {m.email ? "Send reply" : "Save note"}
                    </button>
                  </div>
                </form>
                <form action={resolveAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-xs underline text-muted">
                    Mark resolved without replying
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-muted p-6 text-center">
            {status === "open" ? "Inbox zero — nothing waiting on a reply." : "No resolved messages yet."}
          </p>
        )}
      </div>
    </div>
  );
}
