import sql from "@/lib/db";
import { getSession, hashPassword, destroySession } from "@/lib/auth";
import { createPasswordResetOtp, verifyPasswordResetOtp } from "@/lib/queries";
import { sendPasswordResetOtp } from "@/lib/email";
import { redirect } from "next/navigation";
import { Mail, Lock, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import GuestPage from "@/components/GuestPage";

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
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-[700px] mx-auto">
        <h1 className="aur-hero-in font-display font-semibold text-[clamp(34px,5vw,44px)] leading-[1.1] text-paper">Settings</h1>
        <p className="aur-hero-in text-[15px] text-paper/60 mt-2.5 mb-7" style={{ animationDelay: ".1s" }}>Manage your account and security.</p>

        <div className="flex flex-col gap-[18px]">
          {/* Email */}
          <div className="aur-hero-in" style={{ animationDelay: ".15s" }}>
            <div className="aur-bezel">
              <div className="aur-bezel-inner px-6 py-6 md:px-7">
                <div className="flex items-center gap-[13px] mb-[18px]">
                  <div className="aur-icon-chip !w-[38px] !h-[38px]"><Mail size={17} strokeWidth={1.25} /></div>
                  <h2 className="font-display font-semibold text-[19px] text-paper">Email</h2>
                </div>
                <div className="px-4 py-3.5 rounded-[14px] bg-ink/50 border border-paper/10 text-[14.5px] font-medium text-paper break-all">{session.email}</div>
                <p className="text-[13px] leading-[1.6] text-paper/55 mt-3">
                  Need to change your email? Use{" "}
                  <Link href="/contact" className="aur-inl">Contact Us →</Link>{" "}
                  for now — this isn&apos;t self-service yet.
                </p>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="aur-hero-in" style={{ animationDelay: ".22s" }}>
            <div className="aur-bezel">
              <div className="aur-bezel-inner px-6 py-6 md:px-7">
                <div className="flex items-center gap-[13px] mb-[18px]">
                  <div className="aur-icon-chip !w-[38px] !h-[38px]"><Lock size={17} strokeWidth={1.25} /></div>
                  <h2 className="font-display font-semibold text-[19px] text-paper">Password</h2>
                </div>

                {saved === "1" && (
                  <div className="mb-4 px-3.5 py-[11px] rounded-[13px] text-[13.5px] leading-[1.5] bg-[rgba(127,176,138,.12)] border border-[rgba(127,176,138,.35)] text-[#A9D8B2]">
                    Password updated.
                  </div>
                )}
                {error && error !== "deleteconfirm" && (
                  <div className="aur-alert mb-4 !text-[13.5px] !leading-[1.5] !px-3.5 !py-[11px] !rounded-[13px]">
                    {ERRORS[error] || "Something went wrong."}
                  </div>
                )}

                {emailConfigured ? (
                  codeSent === "1" ? (
                    <>
                      <p className="text-sm leading-[1.65] text-paper/62 mb-4">
                        Check <strong className="text-paper font-medium">{session.email}</strong> for a 6-digit code — it expires in 15 minutes.
                      </p>
                      <form action={changePasswordWithOtpAction} className="flex flex-col gap-3.5">
                        <div>
                          <label className="aur-label">6-digit code</label>
                          <input name="otp" required maxLength={6} placeholder="123456" className="aur-field font-mono-num text-xl text-center tracking-[.5em]" />
                        </div>
                        <div>
                          <label className="aur-label">New password</label>
                          <input name="newPassword" type="password" required minLength={8} placeholder="At least 8 characters" className="aur-field" />
                        </div>
                        <button type="submit" className="aur-btn aur-btn-primary self-start !pl-[22px] !pr-2">
                          Update password
                          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                        </button>
                      </form>
                      <form action={sendCodeAction} className="mt-3.5">
                        <button type="submit" className="text-[12.5px] text-paper/55 underline underline-offset-[3px] hover:text-paper transition-colors">Resend code</button>
                      </form>
                    </>
                  ) : (
                    <>
                      <p className="text-sm leading-[1.65] text-paper/62 mb-4">
                        For security, we&apos;ll email you a code to confirm this change before updating your password.
                      </p>
                      <form action={sendCodeAction}>
                        <button type="submit" className="aur-btn aur-btn-primary !pl-[22px] !pr-2">
                          Send code to my email
                          <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                        </button>
                      </form>
                    </>
                  )
                ) : (
                  <form action={changePasswordSimpleAction} className="flex flex-col gap-3.5">
                    <div>
                      <label className="aur-label">Current password</label>
                      <input name="currentPassword" type="password" required className="aur-field" />
                    </div>
                    <div>
                      <label className="aur-label">New password</label>
                      <input name="newPassword" type="password" required minLength={8} placeholder="At least 8 characters" className="aur-field" />
                    </div>
                    <button type="submit" className="aur-btn aur-btn-primary self-start !pl-[22px] !pr-2">
                      Update password
                      <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Delete account */}
          <div className="aur-hero-in" style={{ animationDelay: ".29s" }}>
            <div className="aur-danger">
              <div className="aur-danger-inner px-6 py-6 md:px-7">
                <div className="flex items-center gap-[13px] mb-[18px]">
                  <div className="aur-icon-chip !w-[38px] !h-[38px] !bg-apricot/[.16]"><Trash2 size={17} strokeWidth={1.25} /></div>
                  <h2 className="font-display font-semibold text-[19px] text-paper">Delete account</h2>
                </div>
                <p className="text-sm leading-[1.65] text-paper/75 mb-4">
                  This permanently deletes your account, profile, job postings or applications,
                  and every message — there&apos;s no undo. Type your email below to confirm.
                </p>
                {error === "deleteconfirm" && (
                  <div className="aur-alert mb-3.5 !text-[13.5px] !leading-[1.5] !px-3.5 !py-[11px] !rounded-[13px]">
                    {ERRORS.deleteconfirm}
                  </div>
                )}
                <form action={deleteAccountAction} className="flex flex-col gap-3.5">
                  <input
                    name="confirmEmail"
                    type="email"
                    placeholder={session.email}
                    required
                    className="aur-field"
                  />
                  <button type="submit" className="aur-btn self-start px-5 py-3 border border-apricot text-apricot bg-apricot/[.08] hover:bg-apricot hover:text-ink !text-[13.5px]">
                    Permanently delete my account
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestPage>
  );
}
