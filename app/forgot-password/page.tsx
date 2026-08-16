import sql from "@/lib/db";
import { createPasswordResetOtp } from "@/lib/queries";
import { sendPasswordResetOtp } from "@/lib/email";
import { redirect } from "next/navigation";
import Link from "next/link";

async function requestResetAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/forgot-password?error=1");

  if (!process.env.RESEND_API_KEY) {
    redirect("/forgot-password?error=noemail");
  }

  // Always redirect to the same "check your email" screen whether or not
  // the account exists — this avoids leaking which emails are registered.
  const rows = (await sql`SELECT id FROM users WHERE email = ${email}`) as { id: number }[];
  if (rows[0]) {
    const otp = await createPasswordResetOtp(rows[0].id);
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
    <div className="px-6 py-12 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">Forgot password</h1>
      <p className="text-sm text-muted mt-2 mb-6">
        Enter your email and we&apos;ll send you a 6-digit code to reset your password.
      </p>

      {error === "1" && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Please enter your email.
        </div>
      )}
      {error === "noemail" && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Password reset emails aren&apos;t set up on this deployment yet — use
          Contact Us instead and we&apos;ll reset it manually.
        </div>
      )}

      <form action={requestResetAction} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted">Email</label>
          <input name="email" type="email" required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
          Send reset code
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        <Link href="/login" className="underline">Back to login</Link>
      </p>
    </div>
  );
}
