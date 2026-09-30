import sql from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { createEmailVerification } from "@/lib/queries";
import { sendVerificationEmail, sendTeamJoinRequestEmail } from "@/lib/email";
import { provisionCompanyProfile } from "@/lib/companyMembership";
import { redirect } from "next/navigation";
import Link from "next/link";
import GlassAuthShell from "@/components/auth/GlassAuthShell";
import PasswordField from "@/components/auth/PasswordField";
import RoleToggle from "@/components/auth/RoleToggle";
import RecruiterTypeToggle from "@/components/auth/RecruiterTypeToggle";
import GoogleButton from "@/components/auth/GoogleButton";
import LinkedInButton from "@/components/auth/LinkedInButton";
import { isGoogleConfigured, isLinkedInConfigured } from "@/lib/oauth";
import { ArrowRight } from "lucide-react";

async function signupAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "");
  const recruiterType = formData.get("recruiterType") === "agency" ? "agency" : "company";

  if (!email || !password || (role !== "candidate" && role !== "company")) {
    redirect(`/signup?role=${role}&error=missing`);
  }
  if (password.length < 8) {
    redirect(`/signup?role=${role}&error=short_password`);
  }

  const existingRows = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existingRows[0]) {
    redirect(`/signup?role=${role}&error=exists`);
  }

  const password_hash = await hashPassword(password);
  const insertRows = await sql`
    INSERT INTO users (email, password_hash, role, auth_provider) VALUES (${email}, ${password_hash}, ${role}, 'password')
    RETURNING id
  `;
  const userId = Number(insertRows[0].id);

  if (role === "candidate") {
    await sql`INSERT INTO candidate_profiles (user_id) VALUES (${userId})`;
  } else {
    const result = await provisionCompanyProfile(userId, email, recruiterType);
    if (result.joinedExistingCompany && result.reviewStatus === "pending_team") {
      await sendTeamJoinRequestEmail(email);
    }
  }

  await createSession({ userId, role: role as "candidate" | "company", email });

  // Email verification only activates once RESEND_API_KEY is configured —
  // this way, testing isn't blocked before that's set up, but the real
  // flow is ready to go the moment it is.
  if (process.env.RESEND_API_KEY) {
    const token = await createEmailVerification(userId);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await sendVerificationEmail(email, `${baseUrl}/verify-email?token=${token}`);
    redirect("/verify-email-pending");
  }

  redirect(role === "candidate" ? "/candidate/onboarding" : "/company/onboarding");
}

const ERRORS: Record<string, string> = {
  missing: "Please fill in every field.",
  short_password: "Password needs to be at least 8 characters.",
  exists: "An account with that email already exists — try logging in instead.",
  no_account: "We couldn't find an account for that sign-in — create one below first.",
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string; type?: string }>;
}) {
  const params = await searchParams;
  const role = params.role === "company" ? "company" : "candidate";
  const recruiterType = params.type === "agency" ? "agency" : "company";
  const error = params.error ? ERRORS[params.error] : null;
  const showOAuth = isGoogleConfigured() || isLinkedInConfigured();

  return (
    <GlassAuthShell
      eyebrow="Get started"
      title={role === "candidate" ? "Find your next role" : "Start hiring on Champ"}
      subtitle={
        role === "candidate"
          ? "Build a profile once, apply everywhere."
          : "Post a job and reach Armenia's tech talent."
      }
    >
      <RoleToggle role={role} />

      {error && (
        <div className="mt-4 aur-alert">
          {error}
        </div>
      )}

      <form action={signupAction} className="flex flex-col gap-3.5 mt-5">
        <input type="hidden" name="role" value={role} />
        {role === "company" && (
          <>
            <input type="hidden" name="recruiterType" value={recruiterType} />
            <RecruiterTypeToggle recruiterType={recruiterType} />
          </>
        )}
        <div>
          <label className="aur-label">
            {role === "company" ? "Work email" : "Email"}
          </label>
          <input name="email" type="email" required placeholder="you@example.com" className="aur-field" />
        </div>
        <PasswordField minLength={8} helperText="At least 8 characters." />
        <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine justify-center w-full !py-3.5 !pl-6 !pr-2 mt-1">
          Create account
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
            {isGoogleConfigured() && (
              <GoogleButton
                clientId={GOOGLE_CLIENT_ID}
                mode="signup"
                role={role}
                recruiterType={role === "company" ? recruiterType : undefined}
              />
            )}
            {isLinkedInConfigured() && (
              <LinkedInButton
                mode="signup"
                role={role}
                recruiterType={role === "company" ? recruiterType : undefined}
              />
            )}
          </div>
        </>
      )}

      <p className="text-[13.5px] text-paper/55 mt-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-[3px] text-paper font-medium hover:text-apricot transition-colors">
          Log in
        </Link>
      </p>
    </GlassAuthShell>
  );
}
