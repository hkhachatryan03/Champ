import { saveContactMessage } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopicSelect from "@/components/TopicSelect";

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
  await saveContactMessage(email, body, topic);
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
    <div className="px-6 py-10 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">Contact us</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Got a question or ran into a problem? Write to us — we usually reply within one business day.
      </p>
      {!process.env.RESEND_API_KEY && (
        <p className="text-xs text-muted mb-6">
          Forgot your password? Mention the email you signed up with and we&apos;ll reset it manually for now —
          real self-service reset needs an email-sending service, which isn&apos;t connected on this deployment yet.
        </p>
      )}
      {sent && (
        <p className="text-sm mb-4 text-moss">Thanks — your message has been sent.</p>
      )}
      <form action={contactAction} className="flex flex-col gap-3">
        {session ? (
          <p className="text-xs text-muted">
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
        <button type="submit" className="mt-1 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
          Send
        </button>
      </form>
    </div>
  );
}
