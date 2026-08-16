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
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
