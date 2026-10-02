import sql from "@/lib/db";
import { verifyPasswordResetOtp } from "@/lib/queries";
import { hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import GlassAuthShell from "@/components/auth/GlassAuthShell";
import PasswordField from "@/components/auth/PasswordField";
import { ArrowRight } from "lucide-react";

async function resetPasswordAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const otp = String(formData.get("otp") || "").trim();
  const newPassword = String(formData.get("newPassword") || "");

  if (!email || !otp || !newPassword) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}&error=missing`);
  }
  if (newPassword.length < 8) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}&error=short`);
  }

  const result = await verifyPasswordResetOtp(email, otp);
  if (!result.ok) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}&error=invalid`);
  }

  const password_hash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${password_hash} WHERE id = ${result.userId}`;

  redirect("/login?reset=1");
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const { email, error } = await searchParams;

  const ERRORS: Record<string, string> = {
    missing: "Please fill in every field.",
    short: "New password needs to be at least 8 characters.",
    invalid: "That code is wrong, expired, or already used. Request a new one.",
  };

  return (
    <GlassAuthShell
      eyebrow="Account recovery"
      title="Enter your reset code"
      subtitle="Check your email for a 6-digit code — it expires in 15 minutes."
    >
      {error && (
        <div className="aur-alert mb-4 !text-[13.5px] !leading-[1.5] !px-3.5 !py-[11px] !rounded-[13px]">
          {ERRORS[error] || "Something went wrong."}
        </div>
      )}

      <form action={resetPasswordAction} className="flex flex-col gap-4">
        <div>
          <label className="aur-label">Email</label>
          <input name="email" type="email" defaultValue={email} required placeholder="you@example.com" className="aur-field" />
        </div>
        <div>
          <label className="aur-label">6-digit code</label>
          <input name="otp" required maxLength={6} placeholder="123456" className="aur-field font-mono-num text-[19px] tracking-[.35em]" />
        </div>
        <PasswordField label="New password" name="newPassword" minLength={8} />
        <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine justify-center w-full !py-3.5 !pl-5 !pr-2 mt-1">
          Reset password
          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
        </button>
      </form>

      <p className="text-[13.5px] text-paper/55 mt-[18px] text-center">
        <Link href="/forgot-password" className="underline underline-offset-[3px] text-paper font-medium hover:text-apricot transition-colors">Didn&apos;t get a code? Request another</Link>
      </p>
    </GlassAuthShell>
  );
}
