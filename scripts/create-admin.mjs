// One-time script to create (or update the password for) an admin login.
// This is completely separate from candidate/company accounts in `users` —
// admins are their own table, so there's no shared password or session.
//
// Usage:
//   DATABASE_URL="postgres://..." node scripts/create-admin.mjs you@example.com "a-strong-password" "Your Name"
//
// Safe to run again with the same email — it updates the password instead
// of failing, which is handy if you ever forget it.
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
const [, , email, password, name] = process.argv;

if (!url) {
  console.error("Set DATABASE_URL first, e.g.:");
  console.error('  DATABASE_URL="postgres://..." node scripts/create-admin.mjs you@example.com "password" "Your Name"');
  process.exit(1);
}
if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [name]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Use a password with at least 8 characters — this account can moderate and edit the whole platform.");
  process.exit(1);
}

const sql = neon(url);

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await sql`SELECT id FROM admins WHERE email = ${normalizedEmail}`;
  if (existing.length > 0) {
    await sql`UPDATE admins SET password_hash = ${passwordHash}, name = ${name || ""} WHERE email = ${normalizedEmail}`;
    console.log(`Updated password for existing admin: ${normalizedEmail}`);
  } else {
    await sql`
      INSERT INTO admins (email, password_hash, name)
      VALUES (${normalizedEmail}, ${passwordHash}, ${name || ""})
    `;
    console.log(`Created new admin: ${normalizedEmail}`);
  }
}

main().catch((err) => {
  console.error("Failed to create/update admin:", err);
  process.exit(1);
});
