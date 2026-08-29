# Champ — real codebase (v16)

This is a working Next.js application — real hosted database (Neon
Postgres), real password hashing, real sessions, real job/application/chat
logic, and real cloud file storage (Vercel Blob) for CVs and photos.

## What's new in v16

**Note on this round:** it involved genuine structural surgery (extracting
the chat experience into a shared component used by two different pages).
Everything here passes a clean build, but hasn't been through a live
click-through test — worth treating this round with a bit more care than
usual until you've tried it yourself.

- Two-pane inbox for companies: conversation list on the left, the open
  chat in the middle/right — filters stayed at the top. The chat thread
  itself is now a shared component, so the standalone thread page and the
  inbox can never drift apart from each other
- Chat message pagination: shows the most recent 30 messages by default,
  with a "Load earlier messages" link, Messenger-style
- Online / last-active status shown in every chat header ("Online now",
  "5m ago", "2h ago", "3d ago", "1mo ago")
- Position and company filters on "All roles" are now real multi-select
  autocomplete fields, populated from actual posted job titles and
  registered companies — not free text
- Active filters now show as removable chips above every filter section
- "Preview as recruiters/candidates see me" — see your own profile exactly
  as the other side does, in a new tab
- Rich text (bold/italic/bullets/numbering) now available on company
  description, candidate "about," and job description — not just chat —
  and always renders with real line breaks preserved
- Fixed: company photos weren't showing to candidates at all (the public
  company page never rendered the avatar)
- Fixed: the reaction/edit/delete hover menu was reflowing and visually
  distorting the message bubble — rebuilt as a true absolute overlay
- Fixed: "Back" from a candidate profile went to the wrong page — now uses
  real browser history instead of a hardcoded destination
- Fixed: clicking the logo now goes to "For You" (matching its new
  first-tab position) instead of "All roles"
- Active nav tab is now highlighted
- "Armenia (remote, location doesn't matter)" cleaned up to just "Armenia"
  everywhere it appears
- Contact form now accepts an optional attachment

## What's new in v15

- New "Candidates" hub for companies — every actively-looking candidate,
  filterable by position, location, minimum experience, skills, and salary
- Position detail page redesigned: description and a compact stats panel
  side by side, applicants below (now with profile links, not just chat)
- Candidate detail page redesigned: full profile info on the left, their
  status on your roles in a sticky sidebar on the right
- Certifications section for candidates (name, issuer, link or file) —
  visible on their own profile and to companies viewing them
- "All roles" page redesigned: jobs listed vertically, filters moved to a
  right-hand sidebar, salary filter is now a drag-to-set range slider
  (typing exact numbers still works too)
- "For you" now appears before "All roles" in the candidate nav
- Fixed: composer no longer leaves old text behind after sending — the
  previous fix had a real timing bug; this one resets the DOM directly
  once the server confirms the send actually happened
- Fixed: LinkedIn link wasn't clickable on the onboarding screen

## What's new in v14

- Photo cropping before upload (candidate and company photos)
- Chat now supports file attachments and basic formatting (bold, italic,
  bullet/numbered lists) via a real toolbar
- "Delete my account" added to Settings (requires typing your email to
  confirm; cascades to remove all your data)
- Fixed: avatar upload failures now show a clear message instead of
  silently failing with no feedback
- Fixed: the "Role" link inside a chat thread now goes to the correct
  page depending on whether you're the candidate or the company
- Fixed: a candidate's CV now always shows their current file in chat,
  not a frozen snapshot from when they applied
- Fixed: "Armenia" location no longer shows the explanatory parenthetical
  everywhere it's displayed — only in the picker itself
- Status and asking rate now shown wherever an existing connection between
  a candidate and a role is displayed
- Language tags render as proper chips instead of raw "Language:Level" text
- Skill, language, and location picker lists are now alphabetized

## What's new in v13

- Skill, language, and location pickers (searchable/dropdown instead of
  free text) on job posting and candidate profiles
- Profile photos for both candidates and companies
- Candidate location and date of birth fields
- Company inbox filter by position
- Contact form auto-uses your account email and has role-specific topics
- Fixed: status changes and job-form validation errors no longer require a
  page refresh or wipe your typed data
- Fixed: reminder-email cron job now runs daily (Vercel's free plan
  doesn't allow more frequent schedules)
- Fixed: email verification no longer applies retroactively to accounts
  that already finished onboarding before the feature existed

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

1. **Run the database setup script** against your Neon database (safe to
   run again even if you already ran it before — it now also adds several
   new columns/tables this version needs):
   ```bash
   DATABASE_URL="your-neon-connection-string" node scripts/init-db.mjs
   ```

2. **Create a `.env.local` file** (copy `.env.local.example` and fill in
   your real values):
   ```bash
   cp .env.local.example .env.local
   ```
   You need `DATABASE_URL` (from Neon) and `SESSION_SECRET` (any long
   random string) at minimum.

3. **Optional but recommended: email sending, via [Resend](https://resend.com)**
   (free tier available). This powers email verification, "Forgot
   password," and any future emails. Add `RESEND_API_KEY` to `.env.local`
   (and to Vercel's environment variables when deploying). **If you don't
   set this, the app still works fine** — email verification simply stays
   turned off until you do, so this won't block you from testing.

4. **Install and build:**
   ```bash
   npm install
   npm run build
   npm run start
   ```

## Deploying to Vercel

1. Push this code to your GitHub repo.
2. In your Vercel project's Settings → Environment Variables, make sure
   `DATABASE_URL` and `SESSION_SECRET` are set (and `RESEND_API_KEY` if
   you're using email), plus `BLOB_READ_WRITE_TOKEN` (auto-added if you've
   connected a Blob store under the Storage tab).
3. Redeploy.

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
