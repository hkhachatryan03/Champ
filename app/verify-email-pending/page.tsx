import { getSession } from "@/lib/auth";
import { createEmailVerification } from "@/lib/queries";
import { sendVerificationEmail } from "@/lib/email";
import { redirect } from "next/navigation";
import GlassStateCard from "@/components/auth/GlassStateCard";
import { ArrowRight, Mail } from "lucide-react";

async function resendAction() {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");
  const token = await createEmailVerification(session.userId);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  await sendVerificationEmail(session.email, `${baseUrl}/verify-email?token=${token}`);
  redirect("/verify-email-pending?sent=1");
}

export default async function VerifyEmailPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { sent } = await searchParams;

  return (
    <GlassStateCard icon={<Mail size={26} strokeWidth={1.3} />} title="Check your email">
      <p>
        We sent a verification link to <strong>{session.email}</strong>. Click it to
        continue setting up your account.
      </p>
      {sent && <p className="!mt-3.5 text-[13.5px] text-[#8FC79B]">Sent again — check your inbox.</p>}
      <form action={resendAction}>
        <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine !py-[13px] !pl-6 !pr-2">
          Resend email
          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
        </button>
      </form>
    </GlassStateCard>
  );
}
