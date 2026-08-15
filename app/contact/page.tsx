import { saveContactMessage } from "@/lib/queries";
import { redirect } from "next/navigation";

async function contactAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const body = String(formData.get("body") || "");
  if (!body.trim()) redirect("/contact");
  await saveContactMessage(email, body);
  redirect("/contact?sent=1");
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="px-6 py-10 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">Contact us</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Got a question or ran into a problem? Write to us — we usually reply within one business day.
      </p>
      <p className="text-xs text-muted mb-6">
        Forgot your password? Mention the email you signed up with and we'll reset it manually for now —
        real self-service reset needs an email-sending service we haven't connected yet.
      </p>
      {sent && (
        <p className="text-sm mb-4 text-moss">Thanks — your message has been sent.</p>
      )}
      <form action={contactAction} className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-muted">Your email (optional, so we can reply)</label>
          <input name="email" type="email" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
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
