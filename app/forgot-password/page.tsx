import sql from "@/lib/db";
import { createPasswordResetOtp } from "@/lib/queries";
import { sendPasswordResetOtp } from "@/lib/email";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

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
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a 6-digit code."
    >
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
          <input
            name="email"
            type="email"
            required
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-line bg-white text-sm outline-none transition-shadow focus:ring-2 focus:ring-apricot/40 focus:border-apricot"
          />
        </div>
        <button
          type="submit"
          className="mt-2 px-5 py-3 rounded-full font-medium text-sm bg-apricot text-ink hover:bg-apricot-deep hover:text-paper transition-colors w-fit"
        >
          Send reset code
        </button>
      </form>

      <p className="text-sm text-muted mt-8 text-center">
        <Link href="/login" className="underline text-ink font-medium">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
