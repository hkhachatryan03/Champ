import sql from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

async function changePasswordAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (!currentPassword || !newPassword) {
    redirect("/settings?error=missing");
  }
  if (newPassword.length < 8) {
    redirect("/settings?error=short");
  }

  const rows = (await sql`SELECT password_hash FROM users WHERE id = ${session.userId}`) as {
    password_hash: string;
  }[];
  const user = rows[0];
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    redirect("/settings?error=wrong");
  }

  const newHash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${session.userId}`;
  redirect("/settings?saved=1");
}

const ERRORS: Record<string, string> = {
  missing: "Please fill in both password fields.",
  short: "New password needs to be at least 8 characters.",
  wrong: "Your current password is wrong.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { error, saved } = await searchParams;

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">Settings</h1>

      <div className="mt-5 p-4 rounded-xl border border-line bg-white">
        <p className="text-xs font-medium text-muted">Email</p>
        <p className="text-sm mt-1">{session.email}</p>
        <p className="text-xs text-muted mt-2">
          Need to change your email? Use Contact Us for now — this isn't self-service yet.
        </p>
      </div>

      <h2 className="font-display font-semibold text-lg mt-8 mb-3">Change password</h2>

      {saved === "1" && (
        <div className="mb-4 text-sm text-moss bg-moss/10 rounded-lg px-3 py-2">
          Password updated.
        </div>
      )}
      {error && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          {ERRORS[error] || "Something went wrong."}
        </div>
      )}

      <form action={changePasswordAction} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted">Current password</label>
          <input name="currentPassword" type="password" required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">New password</label>
          <input name="newPassword" type="password" required minLength={8} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-ink text-paper w-fit">
          Update password
        </button>
      </form>
    </div>
  );
}
