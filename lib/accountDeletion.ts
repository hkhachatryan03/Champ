import { del } from "@vercel/blob";
import sql from "./db";

// Only ever delete files that live in OUR storage. A column could in principle
// hold some other address; we must never try to delete (or even touch) one.
const isOurFile = (u: unknown): u is string =>
  typeof u === "string" && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(u);

/**
 * Every uploaded file that belongs to — or disappears together with — this
 * account: its own photo, CVs, certificates and attachments, plus (for a
 * company) the CVs and attachments inside conversations on its roles, which are
 * removed with the roles.
 */
export async function collectUserFileUrls(userId: number): Promise<string[]> {
  const [user] = (await sql`SELECT email FROM users WHERE id = ${userId}`) as { email: string }[];
  if (!user) return [];
  const rows = (await sql`
    SELECT avatar_url AS url FROM candidate_profiles WHERE user_id = ${userId}
    UNION ALL SELECT cv_filename FROM candidate_profiles WHERE user_id = ${userId}
    UNION ALL SELECT avatar_url FROM company_profiles WHERE user_id = ${userId}
    UNION ALL SELECT file_url FROM candidate_certifications WHERE user_id = ${userId}
    UNION ALL SELECT cv_filename FROM applications WHERE candidate_user_id = ${userId}
    UNION ALL SELECT a.cv_filename FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_user_id = ${userId}
    UNION ALL SELECT m.attachment_url FROM messages m JOIN applications a ON a.id = m.application_id WHERE a.candidate_user_id = ${userId}
    UNION ALL SELECT m.attachment_url FROM messages m JOIN applications a ON a.id = m.application_id JOIN jobs j ON j.id = a.job_id WHERE j.company_user_id = ${userId}
    UNION ALL SELECT attachment_url FROM contact_messages WHERE lower(email) = lower(${user.email})
  `) as { url: string | null }[];
  return [...new Set(rows.map((r) => r.url).filter(isOurFile))];
}

/**
 * Permanently deletes an account: the database rows (everything else is set up
 * to cascade from the user row), the contact-form messages sent from the
 * account's email address, AND the uploaded files — which live in separate file
 * storage and would otherwise stay online forever after "Delete account".
 *
 * The file list has to be gathered BEFORE the rows are deleted. Removing files
 * is best-effort: a storage hiccup must never block someone's right to delete,
 * so a failure is reported (and logged) rather than thrown.
 */
export async function deleteUserAccount(userId: number): Promise<{ filesFound: number; filesFailed: boolean }> {
  const urls = await collectUserFileUrls(userId);
  const [user] = (await sql`SELECT email FROM users WHERE id = ${userId}`) as { email: string }[];
  if (user) await sql`DELETE FROM contact_messages WHERE lower(email) = lower(${user.email})`;
  await sql`DELETE FROM users WHERE id = ${userId}`;

  let filesFailed = false;
  if (urls.length > 0) {
    try {
      await del(urls);
    } catch (err) {
      filesFailed = true;
      console.error("Account deleted, but its uploaded files could not be removed — clean up manually:", urls, err);
    }
  }
  return { filesFound: urls.length, filesFailed };
}
