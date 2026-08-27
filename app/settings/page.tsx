import sql from "@/lib/db";
import { getSession, hashPassword, destroySession } from "@/lib/auth";
import { createPasswordResetOtp, verifyPasswordResetOtp } from "@/lib/queries";
import { sendPasswordResetOtp } from "@/lib/email";
import { redirect } from "next/navigation";

const emailConfigured = !!process.env.RESEND_API_KEY;

async function deleteAccountAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");

  const confirmEmail = String(formData.get("confirmEmail") || "").trim().toLowerCase();
  if (confirmEmail !== session.email.toLowerCase()) {
    redirect("/settings?error=deleteconfirm");
  }

  // Every related row (profile, jobs, applications, messages, etc.) is set
  // up with ON DELETE CASCADE, so removing the user row cleans up
  // everything else automatically.
  await sql`DELETE FROM users WHERE id = ${session.userId}`;
  await destroySession();
  redirect("/?deleted=1");
}

async function sendCodeAction() {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");
  const otp = await createPasswordResetOtp(session.userId);
  await sendPasswordResetOtp(session.email, otp);
  redirect("/settings?codeSent=1");
}

async function changePasswordWithOtpAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");

  const otp = String(formData.get("otp") || "").trim();
  const newPassword = String(formData.get("newPassword") || "");

  if (!otp || !newPassword) redirect("/settings?error=missing&codeSent=1");
  if (newPassword.length < 8) redirect("/settings?error=short&codeSent=1");

  const result = await verifyPasswordResetOtp(session.email, otp);
  if (!result.ok) redirect("/settings?error=invalid&codeSent=1");

  const newHash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${session.userId}`;
  redirect("/settings?saved=1");
}

async function changePasswordSimpleAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (!currentPassword || !newPassword) redirect("/settings?error=missing");
  if (newPassword.length < 8) redirect("/settings?error=short");

  const rows = (await sql`SELECT password_hash FROM users WHERE id = ${session.userId}`) as {
    password_hash: string;
  }[];
  const user = rows[0];
  const { verifyPassword } = await import("@/lib/auth");
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    redirect("/settings?error=wrong");
  }

  const newHash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${session.userId}`;
  redirect("/settings?saved=1");
}

const ERRORS: Record<string, string> = {
  missing: "Please fill in every field.",
  short: "New password needs to be at least 8 characters.",
  wrong: "Your current password is wrong.",
  invalid: "That code is wrong, expired, or already used.",
  deleteconfirm: "The email you typed doesn't match your account email.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; codeSent?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { error, saved, codeSent } = await searchParams;

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <h1 className="font-display font-semibold text-2xl">Settings</h1>

      <div className="mt-5 p-4 rounded-xl border border-line bg-white">
        <p className="text-xs font-medium text-muted">Email</p>
        <p className="text-sm mt-1">{session.email}</p>
        <p className="text-xs text-muted mt-2">
          Need to change your email? Use Contact Us for now — this isn&apos;t self-service yet.
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

      {emailConfigured ? (
        codeSent === "1" ? (
          <>
            <p className="text-sm text-muted mb-4">
              Check <strong>{session.email}</strong> for a 6-digit code — it expires in 15 minutes.
            </p>
            <form action={changePasswordWithOtpAction} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-muted">6-digit code</label>
                <input name="otp" required maxLength={6} placeholder="123456" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num tracking-widest" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">New password</label>
                <input name="newPassword" type="password" required minLength={8} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
              </div>
              <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-ink text-paper w-fit">
                Update password
              </button>
            </form>
            <form action={sendCodeAction} className="mt-3">
              <button type="submit" className="text-xs text-muted underline">Resend code</button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-muted mb-4">
              For security, we&apos;ll email you a code to confirm this change before updating your password.
            </p>
            <form action={sendCodeAction}>
              <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-ink text-paper w-fit">
                Send code to my email
              </button>
            </form>
          </>
        )
      ) : (
        <form action={changePasswordSimpleAction} className="flex flex-col gap-4">
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
      )}

      <h2 className="font-display font-semibold text-lg mt-10 mb-3">Delete account</h2>
      <div className="p-4 rounded-xl border border-apricot-deep/30 bg-apricot/5">
        <p className="text-sm mb-3">
          This permanently deletes your account, profile, job postings or applications,
          and every message — there&apos;s no undo. Type your email below to confirm.
        </p>
        {error === "deleteconfirm" && (
          <div className="mb-3 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
            {ERRORS.deleteconfirm}
          </div>
        )}
        <form action={deleteAccountAction} className="flex flex-col gap-3">
          <input
            name="confirmEmail"
            type="email"
            placeholder={session.email}
            required
            className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none"
          />
          <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot-deep text-paper w-fit">
            Permanently delete my account
          </button>
        </form>
      </div>
    </div>
  );
}
