import sql from "./db";
import { verifyPassword } from "./auth";

// ============================================================
// Admin login
// ============================================================
export type AdminRow = { id: number; email: string; password_hash: string; name: string };

export async function verifyAdminLogin(email: string, password: string): Promise<AdminRow | null> {
  const rows = (await sql`
    SELECT id, email, password_hash, name FROM admins WHERE email = ${email.trim().toLowerCase()}
  `) as AdminRow[];
  const admin = rows[0];
  if (!admin) return null;
  const ok = await verifyPassword(password, admin.password_hash);
  return ok ? admin : null;
}

// ============================================================
// Audit log — every write action taken through the BackOffice
// ============================================================
export async function logAdminAction(
  adminEmail: string,
  action: string,
  targetType: string = "",
  targetId: string | number = "",
  details: string = ""
) {
  await sql`
    INSERT INTO admin_actions (admin_email, action, target_type, target_id, details)
    VALUES (${adminEmail}, ${action}, ${targetType}, ${String(targetId)}, ${details})
  `;
}

export async function listAdminActions(limit: number = 50) {
  return await sql`
    SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT ${limit}
  `;
}

// ============================================================
// Dashboard overview
// ============================================================
export async function getPlatformOverview() {
  const [[candidates], [companies], [jobs], [applications], [openContact], [pendingFlags], [unverifiedCompanies]] =
    await Promise.all([
      sql`SELECT COUNT(*) as n FROM users WHERE role = 'candidate'`,
      sql`SELECT COUNT(*) as n FROM users WHERE role = 'company'`,
      sql`SELECT COUNT(*) as n FROM jobs WHERE active = 1 AND archived_at IS NULL`,
      sql`SELECT COUNT(*) as n FROM applications`,
      sql`SELECT COUNT(*) as n FROM contact_messages WHERE status = 'open'`,
      sql`SELECT COUNT(*) as n FROM account_flags WHERE resolved = 0`,
      sql`SELECT COUNT(*) as n FROM company_profiles WHERE verified = 0 AND onboarded = 1`,
    ]);
  return {
    candidates: Number(candidates.n),
    companies: Number(companies.n),
    activeJobs: Number(jobs.n),
    applications: Number(applications.n),
    openContactMessages: Number(openContact.n),
    pendingFlags: Number(pendingFlags.n),
    unverifiedCompanies: Number(unverifiedCompanies.n),
  };
}

// ============================================================
// Users (candidates & companies)
// ============================================================
export type AdminUserRow = {
  id: number;
  email: string;
  role: "candidate" | "company";
  created_at: string;
  last_seen_at: string | null;
  email_verified: number;
  name: string;
  onboarded: number;
  verified: number | null; // company only
  flag_count: number;
};

export async function listUsers(opts: {
  role?: "candidate" | "company" | "";
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminUserRow[]> {
  const { role = "", search = "", limit = 50, offset = 0 } = opts;
  const like = `%${search.trim().toLowerCase()}%`;

  const rows = (await sql`
    SELECT
      u.id, u.email, u.role, u.created_at, u.last_seen_at, u.email_verified,
      COALESCE(cp.name, comp.name, '') as name,
      COALESCE(cp.onboarded, comp.onboarded, 0) as onboarded,
      comp.verified as verified,
      (SELECT COUNT(*) FROM account_flags f WHERE f.user_id = u.id AND f.resolved = 0) as flag_count
    FROM users u
    LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
    LEFT JOIN company_profiles comp ON comp.user_id = u.id
    WHERE (${role} = '' OR u.role = ${role})
      AND (
        ${search} = '' OR
        LOWER(u.email) LIKE ${like} OR
        LOWER(COALESCE(cp.name, comp.name, '')) LIKE ${like}
      )
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as any[];

  return rows.map((r) => ({ ...r, flag_count: Number(r.flag_count) }));
}

export async function countUsers(opts: { role?: "candidate" | "company" | ""; search?: string }) {
  const { role = "", search = "" } = opts;
  const like = `%${search.trim().toLowerCase()}%`;
  const [row] = (await sql`
    SELECT COUNT(*) as n
    FROM users u
    LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
    LEFT JOIN company_profiles comp ON comp.user_id = u.id
    WHERE (${role} = '' OR u.role = ${role})
      AND (
        ${search} = '' OR
        LOWER(u.email) LIKE ${like} OR
        LOWER(COALESCE(cp.name, comp.name, '')) LIKE ${like}
      )
  `) as { n: number }[];
  return Number(row.n);
}

export async function getUserDetail(userId: number) {
  const [user] = (await sql`SELECT * FROM users WHERE id = ${userId}`) as any[];
  if (!user) return null;

  const profile =
    user.role === "candidate"
      ? (await sql`SELECT * FROM candidate_profiles WHERE user_id = ${userId}`)[0]
      : (await sql`SELECT * FROM company_profiles WHERE user_id = ${userId}`)[0];

  const flags = await sql`
    SELECT * FROM account_flags WHERE user_id = ${userId} ORDER BY created_at DESC
  `;

  const stats =
    user.role === "candidate"
      ? (await sql`SELECT COUNT(*) as n FROM applications WHERE candidate_user_id = ${userId}`)[0]
      : (await sql`SELECT COUNT(*) as n FROM jobs WHERE company_user_id = ${userId}`)[0];

  return { user, profile, flags, statCount: Number((stats as any)?.n || 0) };
}

// ============================================================
// Jobs
// ============================================================
export async function listJobsAdmin(opts: {
  status?: "active" | "paused" | "archived" | "";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { status = "", search = "", limit = 50, offset = 0 } = opts;
  const like = `%${search.trim().toLowerCase()}%`;

  return (await sql`
    SELECT j.*, comp.name as company_name, comp.verified as company_verified
    FROM jobs j
    JOIN company_profiles comp ON comp.user_id = j.company_user_id
    WHERE (
        ${status} = '' OR
        (${status} = 'archived' AND j.archived_at IS NOT NULL) OR
        (${status} = 'paused' AND j.archived_at IS NULL AND j.active = 0) OR
        (${status} = 'active' AND j.archived_at IS NULL AND j.active = 1)
      )
      AND (
        ${search} = '' OR
        LOWER(j.title) LIKE ${like} OR
        LOWER(comp.name) LIKE ${like}
      )
    ORDER BY j.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as any[];
}

export async function countJobsAdmin(opts: { status?: string; search?: string }) {
  const { status = "", search = "" } = opts;
  const like = `%${search.trim().toLowerCase()}%`;
  const [row] = (await sql`
    SELECT COUNT(*) as n
    FROM jobs j
    JOIN company_profiles comp ON comp.user_id = j.company_user_id
    WHERE (
        ${status} = '' OR
        (${status} = 'archived' AND j.archived_at IS NOT NULL) OR
        (${status} = 'paused' AND j.archived_at IS NULL AND j.active = 0) OR
        (${status} = 'active' AND j.archived_at IS NULL AND j.active = 1)
      )
      AND (
        ${search} = '' OR
        LOWER(j.title) LIKE ${like} OR
        LOWER(comp.name) LIKE ${like}
      )
  `) as { n: number }[];
  return Number(row.n);
}

// Admin-only takedown — distinct from a company pausing/archiving their own
// listing, so we don't overload `active`/`archived_at` with two meanings.
export async function removeJobAsAdmin(jobId: number, adminEmail: string, reason: string) {
  await sql`UPDATE jobs SET active = 0, archived_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = ${jobId}`;
  await logAdminAction(adminEmail, "removed_job", "job", jobId, reason);
}

// ============================================================
// Applications & chat activity
// ============================================================
export async function listApplicationsAdmin(opts: { status?: string; limit?: number; offset?: number }) {
  const { status = "", limit = 50, offset = 0 } = opts;
  return (await sql`
    SELECT
      a.id, a.status, a.created_at, a.updated_at, a.expected_salary,
      j.title as job_title, comp.name as company_name,
      cand.name as candidate_name,
      (SELECT COUNT(*) FROM messages m WHERE m.application_id = a.id AND m.deleted_at IS NULL) as message_count
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN company_profiles comp ON comp.user_id = j.company_user_id
    JOIN candidate_profiles cand ON cand.user_id = a.candidate_user_id
    WHERE ${status} = '' OR a.status = ${status}
    ORDER BY a.updated_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as any[];
}

export async function countApplicationsAdmin(opts: { status?: string }) {
  const { status = "" } = opts;
  const [row] = (await sql`
    SELECT COUNT(*) as n FROM applications a WHERE ${status} = '' OR a.status = ${status}
  `) as { n: number }[];
  return Number(row.n);
}

// ============================================================
// Moderation — account flags & company verification
// ============================================================
export async function flagAccount(userId: number, reason: string, adminEmail: string) {
  await sql`INSERT INTO account_flags (user_id, reason, flagged_by) VALUES (${userId}, ${reason}, ${adminEmail})`;
  await logAdminAction(adminEmail, "flagged_account", "user", userId, reason);
}

export async function listAccountFlags(resolved: boolean = false) {
  return (await sql`
    SELECT f.*, u.email, u.role, COALESCE(cp.name, comp.name, '') as name
    FROM account_flags f
    JOIN users u ON u.id = f.user_id
    LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
    LEFT JOIN company_profiles comp ON comp.user_id = u.id
    WHERE f.resolved = ${resolved ? 1 : 0}
    ORDER BY f.created_at DESC
  `) as any[];
}

export async function resolveAccountFlag(flagId: number, adminEmail: string) {
  await sql`
    UPDATE account_flags
    SET resolved = 1, resolved_by = ${adminEmail}, resolved_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE id = ${flagId}
  `;
  await logAdminAction(adminEmail, "resolved_flag", "account_flag", flagId);
}

export async function listUnverifiedCompanies() {
  return (await sql`
    SELECT comp.*, u.email, u.created_at as user_created_at
    FROM company_profiles comp
    JOIN users u ON u.id = comp.user_id
    WHERE comp.verified = 0 AND comp.onboarded = 1
    ORDER BY u.created_at ASC
  `) as any[];
}

export async function setCompanyVerified(userId: number, verified: boolean, adminEmail: string) {
  await sql`UPDATE company_profiles SET verified = ${verified ? 1 : 0} WHERE user_id = ${userId}`;
  await logAdminAction(adminEmail, verified ? "verified_company" : "unverified_company", "company", userId);
}

// ============================================================
// Support inbox (Contact Us)
// ============================================================
export async function listContactMessages(status: "open" | "resolved" | "" = "open") {
  return (await sql`
    SELECT * FROM contact_messages
    WHERE ${status} = '' OR status = ${status}
    ORDER BY created_at DESC
  `) as any[];
}

export async function replyToContactMessage(id: number, reply: string, adminEmail: string) {
  await sql`
    UPDATE contact_messages
    SET admin_reply = ${reply}, status = 'resolved',
        replied_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS'), replied_by = ${adminEmail}
    WHERE id = ${id}
  `;
  await logAdminAction(adminEmail, "replied_to_contact_message", "contact_message", id);
}

export async function resolveContactMessage(id: number, adminEmail: string) {
  await sql`UPDATE contact_messages SET status = 'resolved' WHERE id = ${id}`;
  await logAdminAction(adminEmail, "resolved_contact_message", "contact_message", id);
}

export async function reopenContactMessage(id: number, adminEmail: string) {
  await sql`UPDATE contact_messages SET status = 'open' WHERE id = ${id}`;
  await logAdminAction(adminEmail, "reopened_contact_message", "contact_message", id);
}

// ============================================================
// Configs — feature flags, static content, shared vocabulary
// ============================================================
export async function listFeatureFlags() {
  return (await sql`SELECT * FROM feature_flags ORDER BY key ASC`) as any[];
}

export async function setFeatureFlag(key: string, enabled: boolean, description: string, adminEmail: string) {
  await sql`
    INSERT INTO feature_flags (key, enabled, description, updated_at)
    VALUES (${key}, ${enabled ? 1 : 0}, ${description}, to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    ON CONFLICT (key) DO UPDATE SET enabled = ${enabled ? 1 : 0}, description = ${description},
      updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
  `;
  await logAdminAction(adminEmail, "set_feature_flag", "feature_flag", key, `enabled=${enabled}`);
}

// Read-only, cheap check other parts of the app can use (e.g. `if
// (await isFeatureEnabled("linkedin_import")) { ... }`) once flags start
// gating real functionality.
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const rows = (await sql`SELECT enabled FROM feature_flags WHERE key = ${key}`) as { enabled: number }[];
  return rows[0] ? rows[0].enabled === 1 : false;
}

export async function getStaticContent(key: string) {
  const rows = (await sql`SELECT * FROM static_content WHERE key = ${key}`) as any[];
  return rows[0] || null;
}

export async function listStaticContent() {
  return (await sql`SELECT * FROM static_content ORDER BY key ASC`) as any[];
}

export async function upsertStaticContent(key: string, title: string, body: string, adminEmail: string) {
  await sql`
    INSERT INTO static_content (key, title, body, updated_by, updated_at)
    VALUES (${key}, ${title}, ${body}, ${adminEmail}, to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    ON CONFLICT (key) DO UPDATE SET title = ${title}, body = ${body}, updated_by = ${adminEmail},
      updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
  `;
  await logAdminAction(adminEmail, "edited_static_content", "static_content", key);
}

export async function listCustomTermsAdmin(category?: "skill" | "institution" | "position") {
  if (!category) return (await sql`SELECT * FROM custom_terms ORDER BY category ASC, value ASC`) as any[];
  return (await sql`SELECT * FROM custom_terms WHERE category = ${category} ORDER BY value ASC`) as any[];
}

export async function deleteCustomTerm(id: number, adminEmail: string) {
  await sql`DELETE FROM custom_terms WHERE id = ${id}`;
  await logAdminAction(adminEmail, "deleted_custom_term", "custom_term", id);
}

// ============================================================
// Analytics
// ============================================================
export async function getSignupsByDay(days: number = 30) {
  return (await sql`
    SELECT
      to_char(d.day, 'YYYY-MM-DD') as day,
      COALESCE(SUM(CASE WHEN u.role = 'candidate' THEN 1 ELSE 0 END), 0) as candidates,
      COALESCE(SUM(CASE WHEN u.role = 'company' THEN 1 ELSE 0 END), 0) as companies
    FROM generate_series(CURRENT_DATE - (${days}::int - 1), CURRENT_DATE, '1 day') as d(day)
    LEFT JOIN users u ON to_char(u.created_at::timestamp, 'YYYY-MM-DD') = to_char(d.day, 'YYYY-MM-DD')
    GROUP BY d.day
    ORDER BY d.day ASC
  `) as any[];
}

export async function getApplicationsByDay(days: number = 30) {
  return (await sql`
    SELECT
      to_char(d.day, 'YYYY-MM-DD') as day,
      COALESCE(COUNT(a.id), 0) as applications
    FROM generate_series(CURRENT_DATE - (${days}::int - 1), CURRENT_DATE, '1 day') as d(day)
    LEFT JOIN applications a ON to_char(a.created_at::timestamp, 'YYYY-MM-DD') = to_char(d.day, 'YYYY-MM-DD')
    GROUP BY d.day
    ORDER BY d.day ASC
  `) as any[];
}

export async function getResponseRate() {
  // "Responded" = the company sent at least one message on the thread —
  // a reasonable proxy for "this application got a real look," distinct
  // from just moving a status dropdown.
  const [row] = (await sql`
    SELECT
      COUNT(DISTINCT a.id) as total,
      COUNT(DISTINCT CASE WHEN m.id IS NOT NULL THEN a.id END) as responded
    FROM applications a
    LEFT JOIN messages m ON m.application_id = a.id AND m.sender_role = 'company'
  `) as { total: number; responded: number }[];
  const total = Number(row.total);
  const responded = Number(row.responded);
  return { total, responded, rate: total > 0 ? Math.round((responded / total) * 100) : 0 };
}

export async function getApplicationStatusBreakdown() {
  return (await sql`
    SELECT status, COUNT(*) as count FROM applications GROUP BY status
  `) as { status: string; count: number }[];
}
