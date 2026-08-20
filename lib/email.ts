import { Resend } from "resend";

// Real email sending, via Resend (https://resend.com — free tier is
// generous enough for early testing). Requires a RESEND_API_KEY
// environment variable.
//
// Resend's free tier only lets you send FROM their shared test domain
// (onboarding@resend.dev) until you verify your own domain with them —
// that's fine for testing, but worth knowing before you wonder why the
// "from" address looks generic.
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const resend = getResendClient();
  if (!resend) {
    console.error("RESEND_API_KEY not set — cannot send verification email.");
    return { ok: false };
  }
  const { error } = await resend.emails.send({
    from: "Champ <onboarding@resend.dev>",
    to,
    subject: "Verify your Champ account",
    html: `
      <p>Welcome to Champ — click below to verify your email and finish setting up your account.</p>
      <p><a href="${verifyUrl}">Verify my email</a></p>
      <p>This link expires in 24 hours. If you didn't sign up for Champ, you can ignore this email.</p>
    `,
  });
  if (error) {
    console.error("Failed to send verification email:", error);
    return { ok: false };
  }
  return { ok: true };
}

export async function sendProfileReminderEmail(to: string, role: "candidate" | "company") {
  const resend = getResendClient();
  if (!resend) {
    console.error("RESEND_API_KEY not set — cannot send reminder email.");
    return { ok: false };
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = role === "candidate" ? `${baseUrl}/candidate/onboarding` : `${baseUrl}/company/onboarding`;
  const { error } = await resend.emails.send({
    from: "Champ <onboarding@resend.dev>",
    to,
    subject: "Finish setting up your Champ profile",
    html: `
      <p>You started signing up for Champ but haven't finished your profile yet.</p>
      <p><a href="${link}">Finish setting up my profile</a></p>
      <p>It only takes a couple of minutes — and ${role === "candidate" ? "companies can't find you until it's done" : "you can't post roles until it's done"}.</p>
    `,
  });
  if (error) {
    console.error("Failed to send reminder email:", error);
    return { ok: false };
  }
  return { ok: true };
}

export async function sendPasswordResetOtp(to: string, otp: string) {
  const resend = getResendClient();
  if (!resend) {
    console.error("RESEND_API_KEY not set — cannot send password reset email.");
    return { ok: false };
  }
  const { error } = await resend.emails.send({
    from: "Champ <onboarding@resend.dev>",
    to,
    subject: "Your Champ password reset code",
    html: `
      <p>Your password reset code is:</p>
      <p style="font-size: 28px; font-weight: 600; letter-spacing: 4px;">${otp}</p>
      <p>This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });
  if (error) {
    console.error("Failed to send password reset email:", error);
    return { ok: false };
  }
  return { ok: true };
}
