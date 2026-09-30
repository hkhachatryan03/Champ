import sql from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import GlassAuthShell from "@/components/auth/GlassAuthShell";
import PasswordField from "@/components/auth/PasswordField";
import GoogleButton from "@/components/auth/GoogleButton";
import LinkedInButton from "@/components/auth/LinkedInButton";
import { isGoogleConfigured, isLinkedInConfigured } from "@/lib/oauth";
import { ArrowRight } from "lucide-react";

type UserRow = {
  id: number;
  email: string;
  password_hash: string | null;
  role: "candidate" | "company";
  auth_provider: string;
};

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const rows = (await sql`
    SELECT id, email, password_hash, role, auth_provider FROM users WHERE email = ${email}
  `) as UserRow[];
  const user = rows[0];

  if (!user) {
    redirect("/login?error=1");
  }
  // OAuth-only accounts have no password to check against — send them to
  // the right button instead of a dead-end "wrong password" message.
  if (!user.password_hash) {
    redirect(`/login?error=oauth_only&provider=${user.auth_provider}`);
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    redirect("/login?error=1");
  }

  await createSession({ userId: user.id, role: user.role, email: user.email });
  redirect(user.role === "candidate" ? "/candidate/jobs" : "/company/dashboard");
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; provider?: string }>;
}) {
  const { error, reset, provider } = await searchParams;
  const showOAuth = isGoogleConfigured() || isLinkedInConfigured();

  return (
    <GlassAuthShell
      eyebrow="Welcome back"
      title="Log in to Champ"
      subtitle="Pick up right where you left off."
    >
      {reset === "1" && (
        <div className="mb-4 aur-alert">
          Password reset — log in with your new password.
        </div>
      )}
      {error === "session" && (
        <div className="mb-4 aur-alert">
          Your session pointed to an account that no longer exists (likely the database was reset) — please log in again.
        </div>
      )}
      {error === "1" && (
        <div className="mb-4 aur-alert">
          Wrong email or password.
        </div>
      )}
      {error === "oauth_only" && (
        <div className="mb-4 aur-alert">
          This account signs in with {provider === "google" ? "Google" : "LinkedIn"} — use the button below instead of a password.
        </div>
      )}
      {error === "oauth" && (
        <div className="mb-4 aur-alert">
          Something went wrong signing in — please try again.
        </div>
      )}
      {error === "oauth_unavailable" && (
        <div className="mb-4 aur-alert">
          That sign-in method isn&apos;t set up on this deployment yet.
        </div>
      )}

      <form action={loginAction} className="flex flex-col gap-3.5">
        <div>
          <label className="aur-label">Email</label>
          <input name="email" type="email" required placeholder="you@example.com" className="aur-field" />
        </div>
        <PasswordField forgotHref="/forgot-password" />
        <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine justify-center w-full !py-3.5 !pl-6 !pr-2 mt-1">
          Log in
          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
        </button>
      </form>

      {showOAuth && (
        <>
          <div className="flex items-center gap-3.5 mt-[22px] mb-4 text-xs text-paper/45">
            <div className="h-px flex-1 bg-paper/15" />
            <span>or continue with</span>
            <div className="h-px flex-1 bg-paper/15" />
          </div>
          <div className="flex flex-col gap-2.5">
            {isGoogleConfigured() && <GoogleButton clientId={GOOGLE_CLIENT_ID} mode="login" />}
            {isLinkedInConfigured() && <LinkedInButton mode="login" />}
          </div>
        </>
      )}

      <p className="text-[13.5px] text-paper/55 mt-6 text-center">
        No account yet?{" "}
        <Link href="/signup?role=candidate" className="underline underline-offset-[3px] text-paper font-medium hover:text-apricot transition-colors">
          Sign up
        </Link>
      </p>
    </GlassAuthShell>
  );
}
