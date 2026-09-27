// One-time setup script. Run this once against your Neon database to
// create all the tables Champ needs:
//
//   DATABASE_URL="your-neon-connection-string" node scripts/init-db.mjs
//
// Safe to run more than once — every statement uses IF NOT EXISTS.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL first, e.g.:");
  console.error('  DATABASE_URL="postgres://..." node scripts/init-db.mjs');
  process.exit(1);
}

const sql = neon(url);

async function main() {
  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('candidate','company')),
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS candidate_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      years_experience INTEGER NOT NULL DEFAULT 0,
      skills TEXT NOT NULL DEFAULT '[]',
      salary_min INTEGER NOT NULL DEFAULT 0,
      salary_max INTEGER NOT NULL DEFAULT 0,
      remote_ok INTEGER NOT NULL DEFAULT 0,
      cv_filename TEXT,
      linkedin_url TEXT NOT NULL DEFAULT '',
      about TEXT NOT NULL DEFAULT '',
      actively_looking INTEGER NOT NULL DEFAULT 1,
      onboarded INTEGER NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS company_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      industry TEXT NOT NULL DEFAULT '',
      size TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      about TEXT NOT NULL DEFAULT '',
      verified INTEGER NOT NULL DEFAULT 0,
      onboarded INTEGER NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      company_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Tech','Non-tech')),
      employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time','Part-time')),
      location TEXT NOT NULL DEFAULT '',
      remote INTEGER NOT NULL DEFAULT 0,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      skills TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      candidate_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cover_note TEXT NOT NULL DEFAULT '',
      cv_filename TEXT,
      expected_salary INTEGER,
      status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New','Interviewing','Offer','Not moving forward')),
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
      updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
      UNIQUE(job_id, candidate_user_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL CHECK (sender_role IN ('candidate','company')),
      body TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS hires (
      id SERIAL PRIMARY KEY,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      monthly_salary INTEGER NOT NULL,
      success_fee INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS candidate_experiences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      start_year INTEGER NOT NULL,
      end_year INTEGER,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  console.log("Done. All tables created (or already existed).");

  console.log("Applying migrations for new columns/tables...");

  // New optional fields on jobs
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS languages TEXT NOT NULL DEFAULT '[]'`;

  // Candidate language skills
  await sql`ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS languages TEXT NOT NULL DEFAULT '[]'`;

  // Recruiter's own name, separate from the company name
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS recruiter_name TEXT NOT NULL DEFAULT ''`;

  // Email verification
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified INTEGER NOT NULL DEFAULT 0`;
  await sql`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  // Password reset via emailed OTP
  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      otp_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  console.log("Done. All migrations applied.");

  console.log("Applying second round of migrations (invite flow, Hired status)...");

  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS invite_status TEXT`;

  // Widen the status CHECK constraint to allow "Hired". Postgres auto-names
  // this constraint applications_status_check by default.
  await sql`ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check`;
  await sql`
    ALTER TABLE applications ADD CONSTRAINT applications_status_check
    CHECK (status IN ('New','Interviewing','Offer','Hired','Not moving forward'))
  `;

  console.log("Done. Second round of migrations applied.");

  console.log("Applying third round of migrations (incomplete-profile reminders)...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_sent INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS birthdate TEXT`;
  await sql`ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
  console.log("Done. Third round of migrations applied.");

  console.log("Applying fourth round of migrations (message attachments)...");
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT`;
  console.log("Done. Fourth round of migrations applied.");

  console.log("Applying fifth round of migrations (Armenia location cleanup)...");
  await sql`UPDATE jobs SET location = 'Armenia' WHERE location LIKE 'Armenia (remote%'`;
  await sql`UPDATE candidate_profiles SET location = 'Armenia' WHERE location LIKE 'Armenia (remote%'`;
  console.log("Done. Fifth round of migrations applied.");

  console.log("Applying sixth round of migrations (message edit/delete/reactions, certifications)...");
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS message_reactions (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL CHECK (sender_role IN ('candidate','company')),
      emoji TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
      UNIQUE(message_id, sender_role)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS candidate_certifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT '',
      link_url TEXT,
      file_url TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;
  console.log("Done. Sixth round of migrations applied.");

  console.log("Applying seventh round of migrations (contact form attachments)...");
  await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT`;
  console.log("Done. Seventh round of migrations applied.");

  console.log("Applying eighth round of migrations (last-active tracking)...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TEXT`;
  console.log("Done. Eighth round of migrations applied.");

  console.log("Applying ninth round of migrations (education, preferred positions, company details)...");
  await sql`
    CREATE TABLE IF NOT EXISTS candidate_education (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      institution TEXT NOT NULL,
      degree TEXT NOT NULL,
      field_of_study TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;
  await sql`ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS preferred_positions TEXT NOT NULL DEFAULT '[]'`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`;
  await sql`
    CREATE TABLE IF NOT EXISTS company_social_links (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;
  console.log("Done. Ninth round of migrations applied.");

  console.log("Applying tenth round of migrations (job archiving)...");
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archived_at TEXT`;
  console.log("Done. Tenth round of migrations applied.");

  console.log("Applying eleventh round of migrations (education dates, certification issue date)...");
  await sql`ALTER TABLE candidate_education ADD COLUMN IF NOT EXISTS start_year INTEGER`;
  await sql`ALTER TABLE candidate_education ADD COLUMN IF NOT EXISTS end_year INTEGER`;
  await sql`ALTER TABLE candidate_certifications ADD COLUMN IF NOT EXISTS issue_date TEXT`;
  console.log("Done. Eleventh round of migrations applied.");

  console.log("Applying twelfth round of migrations (shared vocabulary)...");
  await sql`
    CREATE TABLE IF NOT EXISTS custom_terms (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      value TEXT NOT NULL,
      value_lower TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
      UNIQUE(category, value_lower)
    )
  `;
  console.log("Done. Twelfth round of migrations applied.");

  console.log("Applying thirteenth round of migrations (work experience description)...");
  await sql`ALTER TABLE candidate_experiences ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`;
  console.log("Done. Thirteenth round of migrations applied.");

  console.log("Applying fourteenth round of migrations (BackOffice foundation)...");

  // Admin logins — deliberately a separate table from `users`, so admin
  // access can never be reached via a candidate/company password or session.
  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  // Suspicious-account moderation queue.
  await sql`
    CREATE TABLE IF NOT EXISTS account_flags (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      flagged_by TEXT NOT NULL DEFAULT '',
      resolved INTEGER NOT NULL DEFAULT 0,
      resolved_by TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  // Feature flags — simple on/off toggles the admin can flip without a deploy.
  await sql`
    CREATE TABLE IF NOT EXISTS feature_flags (
      key TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  // Editable static content (Contact Us intro text, Terms of Service, etc.)
  await sql`
    CREATE TABLE IF NOT EXISTS static_content (
      key TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      updated_by TEXT,
      updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  // Audit log — every write an admin makes through the BackOffice, so
  // there's a record of who did what once it's more than just you.
  await sql`
    CREATE TABLE IF NOT EXISTS admin_actions (
      id SERIAL PRIMARY KEY,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT '',
      target_id TEXT,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  `;

  // Support inbox needs to track resolution state and the admin's reply.
  await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'`;
  await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS admin_reply TEXT`;
  await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at TEXT`;
  await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_by TEXT`;

  console.log("Done. Fourteenth round of migrations applied.");

  console.log("Applying fifteenth round of migrations (flag visibility to user)...");
  // Lets an admin optionally send a message to the flagged account itself —
  // separate from `reason`, which stays private/internal. Both can exist
  // independently: you can flag privately, or flag AND warn the person.
  await sql`ALTER TABLE account_flags ADD COLUMN IF NOT EXISTS user_message TEXT`;
  await sql`ALTER TABLE account_flags ADD COLUMN IF NOT EXISTS visible_to_user INTEGER NOT NULL DEFAULT 0`;
  console.log("Done. Fifteenth round of migrations applied.");

  console.log("Applying sixteenth round of migrations (Google/LinkedIn sign-in)...");
  // OAuth-only accounts never get a password, so this can no longer be
  // NOT NULL. Existing password accounts are unaffected — this only
  // widens what's allowed going forward.
  await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_sub TEXT`;
  // Partial unique indexes rather than a UNIQUE column constraint — lets
  // every password-only account keep both columns NULL without colliding.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_idx ON users(google_sub) WHERE google_sub IS NOT NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_linkedin_sub_idx ON users(linkedin_sub) WHERE linkedin_sub IS NOT NULL`;
  console.log("Done. Sixteenth round of migrations applied.");

  console.log("Applying seventeenth round of migrations (recruiter type, company review, team seats)...");
  // `verified` (0/1) already existed and is read all over the app (job
  // cards, admin analytics, etc.) — it stays exactly as-is and keeps
  // meaning "candidates can see this company as verified". `review_status`
  // is the richer state machine on top of it; approve/reject/reconsider
  // helpers keep the two in sync so nothing else has to change.
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending'`;
  await sql`ALTER TABLE company_profiles DROP CONSTRAINT IF EXISTS company_profiles_review_status_check`;
  await sql`
    ALTER TABLE company_profiles ADD CONSTRAINT company_profiles_review_status_check
    CHECK (review_status IN ('pending','pending_team','approved','rejected'))
  `;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS reviewed_at TEXT`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS reviewed_by TEXT`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS recruiter_type TEXT NOT NULL DEFAULT 'company'`;
  await sql`ALTER TABLE company_profiles DROP CONSTRAINT IF EXISTS company_profiles_recruiter_type_check`;
  await sql`
    ALTER TABLE company_profiles ADD CONSTRAINT company_profiles_recruiter_type_check
    CHECK (recruiter_type IN ('company','agency'))
  `;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS self_attested INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS proof_notes TEXT NOT NULL DEFAULT ''`;
  // Team seats: a teammate's row points at the owner's user id. The owner
  // (or the founding recruiter of a not-yet-team company) has this NULL.
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS team_owner_user_id INTEGER REFERENCES users(id)`;
  await sql`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS member_role TEXT NOT NULL DEFAULT 'owner'`;
  await sql`ALTER TABLE company_profiles DROP CONSTRAINT IF EXISTS company_profiles_member_role_check`;
  await sql`
    ALTER TABLE company_profiles ADD CONSTRAINT company_profiles_member_role_check
    CHECK (member_role IN ('owner','admin','member'))
  `;
  // Backfill: every company_profiles row that existed before this migration
  // was created before any review concept existed — treat those as
  // already-trusted rather than retroactively locking out real users.
  await sql`
    UPDATE company_profiles SET review_status = 'approved', reviewed_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS'), reviewed_by = 'system (pre-existing account)'
    WHERE onboarded = 1 AND verified = 1 AND review_status = 'pending'
  `;
  // Agency "hiring on behalf of" — free text, optional, never a link to a
  // real company record (the end client doesn't need a Champ profile).
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT ''`;
  console.log("Done. Seventeenth round of migrations applied.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
