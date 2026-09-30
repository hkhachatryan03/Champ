import { saveContactMessage } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopicSelect from "@/components/TopicSelect";
import ClearableFileInput from "@/components/ClearableFileInput";
import { put } from "@vercel/blob";
import GuestPage from "@/components/GuestPage";
import { ArrowRight, Check } from "lucide-react";

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
    <GuestPage>
      <div className="px-6 pb-24 max-w-5xl mx-auto grid md:grid-cols-[1fr_1.05fr] gap-8 md:gap-14 items-start pt-[calc(var(--nav-h)+2.75rem)]">
        <div className="relative">
          <svg
            className="hidden md:block absolute -left-[110px] -bottom-[400px] w-[420px] h-[420px] pointer-events-none opacity-75"
            viewBox="0 0 420 420" fill="none" stroke="#EA9A2E" strokeWidth="1" aria-hidden="true"
          >
            <circle cx="210" cy="210" r="60" strokeOpacity=".32" />
            <circle cx="210" cy="210" r="110" strokeOpacity=".2" strokeDasharray="3 7" />
            <circle cx="210" cy="210" r="160" strokeOpacity=".12" />
            <circle cx="210" cy="210" r="205" strokeOpacity=".07" />
            <circle cx="318" cy="132" r="5" fill="#EA9A2E" stroke="none" />
            <circle cx="104" cy="290" r="3.5" fill="#EA9A2E" fillOpacity=".6" stroke="none" />
          </svg>
          <div className="relative">
            <div className="aur-eyebrow aur-hero-in">We&apos;re here to help</div>
            <h1 className="aur-hero-in font-display font-semibold text-[clamp(40px,6vw,58px)] leading-[1.05] text-paper mt-5" style={{ animationDelay: ".12s" }}>
              Get in touch
            </h1>
            <p className="aur-hero-in mt-5 text-[17px] text-paper/70 leading-[1.75] max-w-[420px]" style={{ animationDelay: ".24s" }}>
              Got a question or ran into a problem? Send us a note — we usually reply within one business day.
            </p>
          </div>
        </div>

        <div className="aur-hero-in" style={{ animationDelay: ".3s" }}>
          <div className="aur-bezel">
            <div className="aur-bezel-inner p-6 md:p-[30px] flex flex-col gap-[18px]">
              {!process.env.RESEND_API_KEY && (
                <p className="aur-note">
                  Forgot your password? Mention the email you signed up with and we&apos;ll reset it manually for now —
                  real self-service reset needs an email-sending service, which isn&apos;t connected on this deployment yet.
                </p>
              )}
              {sent && (
                <p className="flex items-center gap-2.5 text-sm px-3.5 py-3 rounded-xl bg-apricot/10 border border-apricot/30 text-paper">
                  <Check size={16} strokeWidth={1.5} className="text-apricot flex-shrink-0" />
                  Thanks — your message has been sent.
                </p>
              )}
              <form action={contactAction} encType="multipart/form-data" className="flex flex-col gap-[18px]">
                {session ? (
                  <p className="text-xs text-paper/55 -mt-1">
                    We&apos;ll reply to <strong className="text-paper font-medium">{session.email}</strong> — the email on your account.
                  </p>
                ) : (
                  <div>
                    <label className="aur-label">Your email (optional, so we can reply)</label>
                    <input name="email" type="email" placeholder="you@example.com" className="aur-field" />
                  </div>
                )}
                <TopicSelect glass topics={topics} />
                <div>
                  <label className="aur-label">Message</label>
                  <textarea name="body" rows={4} required className="aur-field" />
                </div>
                <div>
                  <label className="aur-label">Attach a screenshot or file (optional)</label>
                  <ClearableFileInput glass name="attachment" accept="image/*,application/pdf" />
                </div>
                <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine self-start mt-1">
                  Send message
                  <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </GuestPage>
  );
}
