import { NextRequest, NextResponse } from "next/server";
import { findIncompleteSignupsNeedingReminder, markReminderSent } from "@/lib/queries";
import { sendProfileReminderEmail } from "@/lib/email";

// Vercel Cron calls this on a schedule (see vercel.json) and automatically
// sends an Authorization header matching your CRON_SECRET environment
// variable — this check stops anyone else from triggering it manually.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: "Email not configured yet" });
  }

  const pending = await findIncompleteSignupsNeedingReminder();
  let sent = 0;
  for (const user of pending) {
    const result = await sendProfileReminderEmail(user.email, user.role);
    if (result.ok) {
      await markReminderSent(user.id);
      sent++;
    }
  }

  return NextResponse.json({ checked: pending.length, sent });
}
