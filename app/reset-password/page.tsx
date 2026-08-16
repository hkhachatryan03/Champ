import sql from "@/lib/db";
import { verifyPasswordResetOtp } from "@/lib/queries";
import { hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <div className="px-6 py-12 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">Enter your reset code</h1>
      <p className="text-sm text-muted mt-2 mb-6">
        Check your email for a 6-digit code — it expires in 15 minutes.
      </p>

      {error && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          {ERRORS[error] || "Something went wrong."}
        </div>
      )}

      <form action={resetPasswordAction} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted">Email</label>
          <input name="email" type="email" defaultValue={email} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">6-digit code</label>
          <input name="otp" required maxLength={6} placeholder="123456" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num tracking-widest" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">New password</label>
          <input name="newPassword" type="password" required minLength={8} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
          Reset password
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        <Link href="/forgot-password" className="underline">Didn&apos;t get a code? Request another</Link>
      </p>
    </div>
  );
}
