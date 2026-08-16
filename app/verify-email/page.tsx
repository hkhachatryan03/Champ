import { verifyEmailToken } from "@/lib/queries";
import sql from "@/lib/db";
import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="px-6 py-12 max-w-md mx-auto text-center">
        <h1 className="font-display font-semibold text-2xl">Missing verification link</h1>
        <p className="text-sm text-muted mt-2">This link looks incomplete — try the one from your email again.</p>
      </div>
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    return (
      <div className="px-6 py-12 max-w-md mx-auto text-center">
        <h1 className="font-display font-semibold text-2xl">Link expired or already used</h1>
        <p className="text-sm text-muted mt-2 mb-6">
          Verification links expire after 24 hours. Log in and we'll offer to resend one.
        </p>
        <Link href="/login" className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink">
          Go to login
        </Link>
      </div>
    );
  }

  const rows = (await sql`SELECT role FROM users WHERE id = ${result.userId}`) as { role: string }[];
  const role = rows[0]?.role;

  return (
    <div className="px-6 py-12 max-w-md mx-auto text-center">
      <h1 className="font-display font-semibold text-2xl">Email verified ✓</h1>
      <p className="text-sm text-muted mt-2 mb-6">You're all set — let's finish your profile.</p>
      <Link
        href={role === "candidate" ? "/candidate/onboarding" : "/company/onboarding"}
        className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink"
      >
        Continue
      </Link>
    </div>
  );
}
