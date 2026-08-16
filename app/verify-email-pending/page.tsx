import { getSession } from "@/lib/auth";
import { createEmailVerification } from "@/lib/queries";
import { sendVerificationEmail } from "@/lib/email";
import { redirect } from "next/navigation";

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
    <div className="px-6 py-12 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">Check your email</h1>
      <p className="text-sm text-muted mt-2">
        We sent a verification link to <strong>{session.email}</strong>. Click it to
        continue setting up your account.
      </p>
      {sent && <p className="text-sm text-moss mt-3">Sent again — check your inbox.</p>}
      <form action={resendAction} className="mt-6">
        <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-ink text-paper">
          Resend email
        </button>
      </form>
    </div>
  );
}
