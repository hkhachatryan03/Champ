import { getSession } from "@/lib/auth";
import { getCompanyProfile } from "@/lib/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import GlassAuthShell from "@/components/auth/GlassAuthShell";
import { ArrowRight } from "lucide-react";

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
    <GlassAuthShell eyebrow={state.eyebrow} title={state.title}>
      <p className="text-sm text-paper/62 leading-[1.7]">{state.body}</p>

      <div className="mt-7 flex flex-col gap-3">
        <Link
          href="/company/profile"
          className="aur-btn aur-btn-primary aur-btn-shine justify-center w-full !py-3.5 !pl-5 !pr-2"
        >
          Go to my profile
          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
        </Link>
        {profile.review_status === "rejected" && (
          <Link
            href="/contact"
            className="aur-btn justify-center w-full !py-3 border border-paper/15 text-paper !text-sm hover:border-paper/40"
          >
            Contact support
          </Link>
        )}
      </div>
    </GlassAuthShell>
  );
}
