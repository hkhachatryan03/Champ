import { verifyEmailToken } from "@/lib/queries";
import sql from "@/lib/db";
import Link from "next/link";
import GlassStateCard from "@/components/auth/GlassStateCard";
import { AlertTriangle, Check, Hourglass, ArrowRight } from "lucide-react";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <GlassStateCard icon={<AlertTriangle size={26} strokeWidth={1.3} />} title="Missing verification link">
        <p>This link looks incomplete — try the one from your email again.</p>
      </GlassStateCard>
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    return (
      <GlassStateCard icon={<Hourglass size={26} strokeWidth={1.3} />} title="Link expired or already used">
        <p>Verification links expire after 24 hours. Log in and we&apos;ll offer to resend one.</p>
        <Link href="/login" className="aur-btn aur-btn-primary aur-btn-shine !py-[13px] !pl-6 !pr-2">
          Go to login
          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
        </Link>
      </GlassStateCard>
    );
  }

  const rows = (await sql`SELECT role FROM users WHERE id = ${result.userId}`) as { role: string }[];
  const role = rows[0]?.role;

  return (
    <GlassStateCard good icon={<Check size={26} strokeWidth={1.3} />} title="Email verified ✓">
      <p>You&apos;re all set — let&apos;s finish your profile.</p>
      <Link
        href={role === "candidate" ? "/candidate/onboarding" : "/company/onboarding"}
        className="aur-btn aur-btn-primary aur-btn-shine !py-[13px] !pl-6 !pr-2"
      >
        Continue
        <span className="aur-btn-icon"><ArrowRight size={14} /></span>
      </Link>
    </GlassStateCard>
  );
}
