import sql from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

async function signupAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "");

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
    INSERT INTO users (email, password_hash, role) VALUES (${email}, ${password_hash}, ${role})
    RETURNING id
  `;
  const userId = Number(insertRows[0].id);

  if (role === "candidate") {
    await sql`INSERT INTO candidate_profiles (user_id) VALUES (${userId})`;
  } else {
    await sql`INSERT INTO company_profiles (user_id) VALUES (${userId})`;
  }

  await createSession({ userId, role: role as "candidate" | "company", email });
  redirect(role === "candidate" ? "/candidate/onboarding" : "/company/onboarding");
}

const ERRORS: Record<string, string> = {
  missing: "Please fill in every field.",
  short_password: "Password needs to be at least 8 characters.",
  exists: "An account with that email already exists — try logging in instead.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const params = await searchParams;
  const role = params.role === "company" ? "company" : "candidate";
  const error = params.error ? ERRORS[params.error] : null;

  return (
    <div className="px-6 py-12 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">
        {role === "candidate" ? "Sign up as a candidate" : "Sign up as a company"}
      </h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Not the right account type?{" "}
        <Link
          href={`/signup?role=${role === "candidate" ? "company" : "candidate"}`}
          className="underline"
        >
          Switch to {role === "candidate" ? "hiring" : "job seeking"}
        </Link>
        .
      </p>

      {error && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form action={signupAction} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        <div>
          <label className="text-xs font-medium text-muted">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none"
          />
          <p className="text-xs text-muted mt-1">At least 8 characters.</p>
        </div>
        <button
          type="submit"
          className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink"
        >
          Create account
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
