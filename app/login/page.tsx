import sql from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  role: "candidate" | "company";
};

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const rows = (await sql`
    SELECT id, email, password_hash, role FROM users WHERE email = ${email}
  `) as UserRow[];
  const user = rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    redirect("/login?error=1");
  }

  await createSession({ userId: user.id, role: user.role, email: user.email });
  redirect(user.role === "candidate" ? "/candidate/jobs" : "/company/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;

  return (
    <div className="px-6 py-12 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">Log in</h1>

      {reset === "1" && (
        <div className="mt-4 mb-2 text-sm text-moss bg-moss/10 rounded-lg px-3 py-2">
          Password reset — log in with your new password.
        </div>
      )}
      {error === "session" && (
        <div className="mt-4 mb-2 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Your session pointed to an account that no longer exists (likely the database was reset) — please log in again.
        </div>
      )}
      {error === "1" && (
        <div className="mt-4 mb-2 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Wrong email or password.
        </div>
      )}

      <form action={loginAction} className="flex flex-col gap-4 mt-6">
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted">Password</label>
            <Link href="/forgot-password" className="text-xs underline text-muted">
              Forgot password?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink"
        >
          Log in
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        No account yet?{" "}
        <Link href="/signup?role=candidate" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
