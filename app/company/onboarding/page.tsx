import { getSession } from "@/lib/auth";
import { updateCompanyProfile, isEmailVerified, getCompanyProfile } from "@/lib/queries";
import { redirect } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import GuestPage from "@/components/GuestPage";
import { ArrowRight } from "lucide-react";
import { sanitizeRichText } from "@/lib/sanitize";

async function saveCompanyAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const recruiterName = String(formData.get("recruiterName") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const about = sanitizeRichText(String(formData.get("about") || ""));
  const proofNotes = String(formData.get("proofNotes") || "").trim();

  if (!name || !recruiterName || !website || !about.replace(/<[^>]*>/g, "").trim()) {
    redirect("/company/onboarding?error=1");
  }

  await updateCompanyProfile(session.userId, {
    name,
    recruiter_name: recruiterName,
    industry: String(formData.get("industry") || ""),
    size: String(formData.get("size") || ""),
    website,
    about,
    proof_notes: proofNotes,
    onboarded: 1,
  });

  redirect("/company/dashboard");
}

export default async function CompanyOnboarding({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const existingProfile = await getCompanyProfile(session.userId);
  if (!existingProfile.onboarded && process.env.RESEND_API_KEY && !(await isEmailVerified(session.userId))) {
    redirect("/verify-email-pending");
  }
  const { error } = await searchParams;

  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.5rem)] pb-20 max-w-[700px] mx-auto">
        <p className="aur-hero-in aur-kicker">Almost there</p>
        <h1 className="aur-hero-in font-display font-semibold text-[clamp(32px,5vw,42px)] leading-[1.12] text-paper mt-3.5" style={{ animationDelay: ".06s" }}>Company profile</h1>
        <p className="aur-hero-in text-[15px] leading-[1.65] text-paper/62 mt-3 mb-6" style={{ animationDelay: ".12s" }}>
          Website/LinkedIn and a short &quot;about us&quot; are required — candidates
          need at least that much to know who they&apos;d be talking to. Doesn&apos;t
          need to be long.
        </p>
        {!!existingProfile.self_attested && (
          <div className="mb-[18px] px-4 py-[13px] rounded-2xl bg-apricot/10 border border-apricot/30 text-[13.5px] leading-[1.6] text-[#F6D3A6]">
            You signed up with a personal email address rather than a company domain, so we&apos;ll take an extra look before approving your account.
          </div>
        )}
        {error && (
          <div className="aur-alert mb-4 !text-[13.5px] !leading-[1.5] !px-3.5 !py-[11px] !rounded-[13px]">
            Please fill in your name, company name, website/LinkedIn, and a short about-us.
          </div>
        )}
        <form action={saveCompanyAction} className="aur-hero-in flex flex-col gap-4" style={{ animationDelay: ".18s" }}>
          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>You &amp; your company</h3>
              <div>
                <label className="aur-label">Your name (the recruiter)</label>
                <input name="recruiterName" required placeholder="e.g. Anna Petrosyan" className="aur-field" />
                <p className="text-xs leading-[1.55] text-paper/50 mt-1.5">Shown to candidates so they know who they&apos;re talking to — useful if your company has more than one recruiter.</p>
              </div>
              <div>
                <label className="aur-label">Company name</label>
                <input name="name" required placeholder="Lusar Labs" className="aur-field" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="aur-label">Industry</label>
                  <input name="industry" placeholder="Fintech" className="aur-field" />
                </div>
                <div>
                  <label className="aur-label">Company size</label>
                  <input name="size" placeholder="11–50 employees" className="aur-field" />
                </div>
              </div>
              <div>
                <label className="aur-label">Website or LinkedIn (required)</label>
                <input name="website" required placeholder="lusarlabs.am" className="aur-field" />
              </div>
              {!!existingProfile.self_attested && (
                <div>
                  <label className="aur-label">Help us verify your business (optional)</label>
                  <textarea
                    name="proofNotes"
                    rows={3}
                    placeholder="You signed up with a personal email address, so this helps our review team confirm you're a real business — a registration number, a link to your team, anything that helps."
                    className="aur-field"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>Short &quot;about us&quot; (required)</h3>
              <RichEditor glass name="about" required minHeight={90} placeholder="One or two sentences on what you do." />
            </div>
          </div>
          <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine justify-center w-full !py-3.5 !pl-6 !pr-2">
            Continue to dashboard
            <span className="aur-btn-icon"><ArrowRight size={14} /></span>
          </button>
        </form>
      </div>
    </GuestPage>
  );
}
