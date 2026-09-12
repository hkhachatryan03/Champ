import { saveContactMessage } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopicSelect from "@/components/TopicSelect";
import ClearableFileInput from "@/components/ClearableFileInput";
import { put } from "@vercel/blob";

const CANDIDATE_TOPICS = [
  "Question about my profile",
  "Question about an application",
  "Report a bug",
];

const COMPANY_TOPICS = [
  "Verification request",
  "Billing question",
  "Question about a candidate",
  "Report a bug",
];

const GENERAL_TOPICS = ["General question", "Report a bug"];

async function contactAction(formData: FormData) {
  "use server";
  const session = await getSession();
  const email = session ? session.email : String(formData.get("email") || "");
  const body = String(formData.get("body") || "");
  const topicChoice = String(formData.get("topicChoice") || "");
  const customTopic = String(formData.get("customTopic") || "").trim();
  const topic = topicChoice === "Other" ? customTopic : topicChoice;

  if (!body.trim()) redirect("/contact");

  let attachmentUrl: string | null = null;
  const file = formData.get("attachment") as File | null;
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = `contact/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const blob = await put(safeName, buffer, { access: "public", contentType: file.type || "application/octet-stream" });
      attachmentUrl = blob.url;
    } catch (err) {
      console.error("Blob upload failed (contact attachment):", err);
    }
  }

  await saveContactMessage(email, body, topic, attachmentUrl);
  redirect("/contact?sent=1");
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const session = await getSession();
  const { sent } = await searchParams;

  const topics = session?.role === "candidate" ? CANDIDATE_TOPICS : session?.role === "company" ? COMPANY_TOPICS : GENERAL_TOPICS;

  return (
    <div>
      <div className="bg-ink">
        <div className="px-6 pt-14 pb-16 max-w-lg mx-auto">
          <p className="text-xs font-medium text-apricot uppercase tracking-wide">We&apos;re here to help</p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-paper mt-3">
            Get in touch
          </h1>
          <p className="mt-4 text-base text-paper/70 leading-relaxed">
            Got a question or ran into a problem? Send us a note — we usually reply within one business day.
          </p>
        </div>
      </div>

      <div className="px-6 -mt-8 pb-16 max-w-lg mx-auto">
        <div className="p-6 rounded-2xl border border-line bg-white shadow-sm">
          {!process.env.RESEND_API_KEY && (
            <p className="text-xs text-muted mb-5 p-3 rounded-lg bg-paper-dim">
              Forgot your password? Mention the email you signed up with and we&apos;ll reset it manually for now —
              real self-service reset needs an email-sending service, which isn&apos;t connected on this deployment yet.
            </p>
          )}
          {sent && (
            <p className="text-sm mb-5 px-3 py-2 rounded-lg bg-moss/10 text-moss">
              Thanks — your message has been sent.
            </p>
          )}
          <form action={contactAction} encType="multipart/form-data" className="flex flex-col gap-4">
            {session ? (
              <p className="text-xs text-muted -mt-1">
                We&apos;ll reply to <strong>{session.email}</strong> — the email on your account.
              </p>
            ) : (
              <div>
                <label className="text-xs font-medium text-muted">Your email (optional, so we can reply)</label>
                <input name="email" type="email" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
              </div>
            )}
            <TopicSelect topics={topics} />
            <div>
              <label className="text-xs font-medium text-muted">Message</label>
              <textarea name="body" rows={4} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Attach a screenshot or file (optional)</label>
              <div className="mt-1"><ClearableFileInput name="attachment" accept="image/*,application/pdf" /></div>
            </div>
            <button type="submit" className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
              Send message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
