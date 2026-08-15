# Champ — real codebase (v8, Postgres + Blob edition)

This is a working Next.js application — real hosted database (Neon
Postgres), real password hashing, real sessions, real job/application/chat
logic, and real cloud file storage (Vercel Blob) for CVs.

## What changed in this version

Earlier versions used a local SQLite file and local disk for CV uploads —
fine for testing on your own computer, but it doesn't survive on any real
hosting platform (their filesystems are ephemeral). This version replaces
both:

- **Database:** local SQLite → hosted Postgres via [Neon](https://neon.tech)
- **File storage:** local `public/uploads` folder → [Vercel Blob](https://vercel.com/docs/vercel-blob)

Every page and feature works exactly the same — this was a backend swap,
not a redesign.

## Setting up before you can run this

1. **Run the one-time database setup script** against your Neon database:
   ```bash
   DATABASE_URL="your-neon-connection-string" node scripts/init-db.mjs
   ```
   This creates all the tables. Safe to run more than once.

2. **Create a `.env.local` file** (copy `.env.local.example` and fill in
   your real values):
   ```bash
   cp .env.local.example .env.local
   ```
   You need `DATABASE_URL` (from Neon) and `SESSION_SECRET` (any long
   random string) at minimum. `BLOB_READ_WRITE_TOKEN` is only needed
   locally if you want to test CV uploads before deploying — grab it from
   Vercel's dashboard (Project → Storage → your Blob store → the
   `.env.local` tab shows it), or skip it and just test CV uploads after
   deploying, where Vercel provides it automatically.

3. **Install and build:**
   ```bash
   npm install
   npm run build
   npm run start
   ```

## Deploying to Vercel

1. Push this code to your GitHub repo (already done if you're reading
   this from the repo).
2. Import the repo into Vercel as a project.
3. In that project: Storage tab → Create Database → Blob (this
   auto-adds `BLOB_READ_WRITE_TOKEN` to the project — no manual copying).
4. In Settings → Environment Variables, add `DATABASE_URL` (your Neon
   connection string) and `SESSION_SECRET` (a long random string —
   **different from any placeholder value**, this protects real user
   sessions).
5. Deploy.

## What's still stubbed (clearly labeled in the UI, not hidden)

- LinkedIn import — we extract a best-guess name from the profile URL,
  but can't fetch real LinkedIn data without their official API
- The success-fee billing itself — there's a `hires` table ready to record
  a confirmed hire, but no payment processor is wired up yet
- Emails (verification, password reset) — no email service connected yet;
  Contact Us currently serves as the manual fallback for both

## Project structure

```
app/                   — every page and route, organized by URL
  candidate/           — everything a candidate sees
  company/             — everything a company sees
  thread/[id]/         — the shared chat view used by both sides
  signup/, login/      — auth
lib/
  db.ts                — Postgres (Neon) connection
  auth.ts              — password hashing, sessions
  queries.ts           — every database read/write, in one place (all async)
  guards.ts            — onboarding-completion checks
  cvParsing.ts         — best-effort CV/LinkedIn name extraction
scripts/
  init-db.mjs          — one-time database schema setup
components/            — shared UI pieces (nav bar, job form, charts, etc.)
proxy.ts               — route protection (redirects based on role)
```
