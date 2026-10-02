import sql from "@/lib/db";
import { createPasswordResetOtp } from "@/lib/queries";
import { sendPasswordResetOtp } from "@/lib/email";
import { redirect } from "next/navigation";
import Link from "next/link";
import GlassAuthShell from "@/components/auth/GlassAuthShell";
import { ArrowRight } from "lucide-react";

async function requestResetAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/forgot-password?error=1");

  if (!process.env.RESEND_API_KEY) {
    redirect("/forgot-password?error=noemail");
  }

  // Always redirect to the same "check your email" screen whether or not
  // the account exists — this avoids leaking which emails are registered.
  const rows = (await sql`
    SELECT id, password_hash, auth_provider FROM users WHERE email = ${email}
  `) as { id: number; password_hash: string | null; auth_provider: string }[];
  const user = rows[0];

  if (user) {
    // OAuth-only accounts have nothing to reset — point them at the right
    // button instead of sending a code for a password that doesn't exist.
    // (This does confirm the account exists, which is a deliberate,
    // narrow exception to the no-enumeration rule above — the same
    // trade-off most platforms make for this exact case.)
    if (!user.password_hash) {
      redirect(`/login?error=oauth_only&provider=${user.auth_provider}`);
    }
    const otp = await createPasswordResetOtp(user.id);
    await sendPasswordResetOtp(email, otp);
  }

  redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <GlassAuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a 6-digit code."
    >
      {error === "1" && (
        <div className="aur-alert mb-4 !text-[13.5px] !leading-[1.5] !px-3.5 !py-[11px] !rounded-[13px]">
          Please enter your email.
        </div>
      )}
      {error === "noemail" && (
        <div className="aur-alert mb-4 !text-[13.5px] !leading-[1.5] !px-3.5 !py-[11px] !rounded-[13px]">
          Password reset emails aren&apos;t set up on this deployment yet — use
          Contact Us instead and we&apos;ll reset it manually.
        </div>
      )}

      <form action={requestResetAction} className="flex flex-col gap-4">
        <div>
          <label className="aur-label">Email</label>
          <input name="email" type="email" required placeholder="you@example.com" className="aur-field" />
        </div>
        <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine justify-center w-full !py-3.5 !pl-5 !pr-2 mt-1">
          Send reset code
          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
        </button>
      </form>

      <p className="text-[13.5px] text-paper/55 mt-[18px] text-center">
        <Link href="/login" className="underline underline-offset-[3px] text-paper font-medium hover:text-apricot transition-colors">
          Back to login
        </Link>
      </p>
    </GlassAuthShell>
  );
}
