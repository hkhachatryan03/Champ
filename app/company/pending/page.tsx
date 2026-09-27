import { getSession } from "@/lib/auth";
import { getCompanyProfile } from "@/lib/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export default async function CompanyPendingPage() {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const profile = await getCompanyProfile(session.userId);
  if (!profile) redirect("/login?error=session");
  if (profile.review_status === "approved") redirect("/company/dashboard");

  const copy = {
    pending: {
      eyebrow: "Under review",
      title: "Your company is under review",
      body: "Champ reviews every new company before it can post jobs or message candidates — this is usually quick. You can still finish your profile in the meantime; we'll email you the moment a decision is made.",
    },
    pending_team: {
      eyebrow: "Waiting for your team",
      title: "Waiting for your team to approve you",
      body: `Someone at ${profile.name || "your company"} already has an account on Champ, and they need to approve you before you can post jobs or message candidates. Ask them to check their Champ profile page.`,
    },
    rejected: {
      eyebrow: "Application declined",
      title: "This company wasn't approved",
      body:
        profile.rejection_reason ||
        "Champ wasn't able to verify this company. If you think this is a mistake, reach out and we'll take another look.",
    },
  } as const;

  const state = copy[profile.review_status as "pending" | "pending_team" | "rejected"] || copy.pending;

  return (
    <AuthShell eyebrow={state.eyebrow} title={state.title}>
      <p className="text-sm text-muted leading-relaxed">{state.body}</p>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/company/profile"
          className="px-5 py-3 rounded-full font-medium text-sm bg-apricot text-ink hover:bg-apricot-deep hover:text-paper transition-colors text-center"
        >
          Go to my profile
        </Link>
        {profile.review_status === "rejected" && (
          <Link
            href="/contact"
            className="px-5 py-3 rounded-full font-medium text-sm border border-line text-ink hover:border-ink/30 transition-colors text-center"
          >
            Contact support
          </Link>
        )}
      </div>
    </AuthShell>
  );
}
