# Champ — real codebase (v24)

This is a working Next.js application — real hosted database (Neon
Postgres), real password hashing, real sessions, real job/application/chat
logic, and real cloud file storage (Vercel Blob) for CVs and photos.

## What's new in v24

- **Logo redesigned**: the icon now sits directly against "hamp," reading
  as "Champ" — icon + hamp = Champ, everywhere the logo appears.
- **Public "Open roles" listing now uses the same job card** as the
  logged-in "All roles"/"For you" pages — one shared component, so they
  can never drift apart from each other again.
- **Company logos now show on job cards** wherever a company has
  uploaded one, falling back to the first-letter avatar only when they
  haven't.
- **Tech/Non-tech category label removed from job cards and the job
  detail page** — still fully usable as a filter behind the scenes, just
  no longer shown as a tag, per feedback that it was cluttering the card.
- **Skills and languages redesigned** on the job detail page: skills now
  sit in their own card with a cleaner chip style, and languages show a
  segmented proficiency bar (visualizing A1 through Native) instead of
  plain "· C1" text.

## What's new in v23

- **New official logo** — installed everywhere: the nav bar, browser tab
  favicon, and app/bookmark icons, using the exact brand color and mark
  from the provided assets.
- **"All roles" and "For you" redesigned** — a new shared job card:
  company-initial avatar, hover-lift animation, salary in a highlighted
  pill, skills truncated with "+N more" instead of wrapping endlessly.
- **Job detail page redesigned** — company avatar in the header, salary
  in a highlighted card, and skills/languages moved above the
  description (previously buried at the bottom).
- **Work experience, education, and certifications are now fully
  editable**, not just removable — each item has a real "Edit" button
  that turns it into an inline form (Save/Cancel), in addition to the
  existing add/remove.
- **Work experience now supports an optional description** of what you
  actually did in the role — visible to companies viewing the profile,
  not just stored.

## What's new in v22

**On the recurring "Save doesn't work" bug:** I want to be honest that I
couldn't identify one single, deterministic cause through code review
alone this time — I don't have a way to run a live browser test from
where I work. What I did do: added a genuine second layer of defense, so
the editor's content is now re-read directly from the live editor
instance at the exact moment the form submits, rather than depending on
an earlier update event having already fired. This closes off a real
category of possible failure regardless of the exact original cause. If
it still happens after this, the most useful thing you can tell me is the
exact steps that trigger it (which field, which browser, how much time
between typing and clicking Save) so this can be narrowed down precisely
instead of guessed at again.

**Editing/deleting messages is now disabled in closed conversations** —
enforced both in the interface and on the server (so it can't be
bypassed), while reactions stay available.

**Two full page redesigns** — "What is Champ?" and the homepage both got
a bolder, more interactive treatment: larger typography, a textured hero
background, icon-based feature cards with hover effects, and (on the
homepage) a live mockup of an actual salary listing to make the core
promise concrete rather than just a line of text. Content and messaging
are unchanged — this was a visual pass only.

## What's new in v21

**Fixed the "Save doesn't work" bug** for job descriptions and profile
"about" sections. Root cause: the rich text editor was looking up its
hidden form field by ID at save time, which could silently fail; switched
to a direct reference, matching the pattern already working correctly in
chat.

**Shared, auto-capitalized vocabulary for skills, positions, and
universities.** Typing a term that isn't in our list now normalizes its
casing (title case, with small words like "of"/"the" kept lowercase, and
~50 known tech acronyms/compounds like SQL, MySQL, DevOps, Node.js kept
in their proper form) and adds it to a shared list — so it shows up as a
suggestion for everyone afterward, on either side.

**Unsaved-changes warning**, on profile editing and job posting/editing.
Reliably warns on closing the tab or refreshing (the browser's own
mechanism), and now also intercepts clicks on our own in-app links with a
custom "Stay & keep editing" / "Leave without saving" dialog.

**My Applications now matches the Inbox** — same two-pane layout, same
shared `ThreadView` component, multi-select status filter, and a new
position filter that auto-updates as you apply to more roles. The stats
chart stays at the top, as requested.

**Other fixes and additions:**
- Photo edit menu now closes when clicking anywhere else
- Chat timestamps at minute-level (not seconds), shown for both sides of
  a conversation, not just your own messages
- Education: start/end years, sorted like work experience when dates are
  given, falling back to degree seniority (PhD → Master's → Bachelor's →
  Associate's → High School) when they're not
- Certification issue date is now required (month + year), and its
  display on the company side redesigned to match the Work
  Experience/Education timeline style
- Contact page and Settings page visually redesigned (content unchanged)

## What's new in v20

Two real bugs found in last version's rich-text editor, both fixed:

- **Bullet points/numbering appeared to do nothing when clicked.** The
  list actually was being created correctly — but Tailwind's CSS reset
  strips the visual bullet/number markers from every `<ul>`/`<ol>` by
  default, and that fix had only been applied to the read-only display,
  not the live editor itself. Now fixed in both places.
- **The "Write a message…" placeholder never disappeared while typing,**
  and toolbar buttons never highlighted when your cursor was on
  bold/italic/list text. Root cause: reading the editor's live state
  directly during render doesn't make React re-render when that state
  changes internally. Fixed by tracking it as real React state, updated
  through the editor's own change events.

**On old content showing raw `**text**` and run-together lines:** based on
what you shared, this is very likely content saved before the rich-text
editor rewrite (v19) — the old format stored literal markdown-style text,
and the new display doesn't parse that syntax anymore. Re-editing and
re-saving that specific content through the current editor should fix how
it displays. If you're still seeing this on genuinely new content typed
after upgrading to v20, that would be worth flagging as a separate bug.

**Other fixes and additions:**
- "What is Champ?" now appears first in the nav, before Browse
  Roles/Settings, in every context
- The "What is Champ?" page's bottom buttons now adapt to who's viewing:
  only "Browse open roles" for candidates, only "Post a role" for
  companies, both for guests
- Profile photo editing moved to directly overlay the top avatar (an
  edit-pencil icon, saves independently and immediately) instead of a
  separate field buried in the edit form below — for both candidates
  and companies
- University/school field now offers a searchable list of major Armenian
  universities, with free text still accepted (same pattern as skills)
- Confirmed and documented: skills you type that aren't in the suggestion
  list are saved exactly as typed, with no capitalization normalization

## What's new in v19

**Real rich text editor.** Replaced the old markdown-in-a-textarea
approach with [Tiptap](https://tiptap.dev), a genuine, widely-used editor
library — used for chat, job descriptions, and both "about" sections.
This fixes the whole class of bugs the old approach had: selecting
multiple lines and clicking bullet/numbered now applies to the whole
selection (not just the first line), clicking it again correctly toggles
it off, and formatting renders live while typing instead of showing raw
`**`/`-` characters. Content is sanitized server-side against a strict
allowlist before it's ever saved, regardless of what a request claims to
contain. **Note:** existing text saved under the old format will display
as plain unformatted text now — new content looks correct going forward.

**Job lifecycle: Pause vs. Archive.** Two distinct actions now exist —
Pause (temporary, reversible any time, hides the role) and Archive
(the role and its conversations are hidden immediately; nothing is
permanently deleted for 90 days, during which it can be restored;
after that, it's gone for good). Getting a candidate to "Hired" now
automatically archives the role. Paused/archived roles, and any
conversation marked "Not moving forward," now show a clear banner and
lock the chat — informing everyone involved that nothing was deleted,
just closed.

**Recruiter quick actions.** Companies reviewing a fresh, candidate-
initiated application now get one-click "Move to Interviewing" / "Decline"
buttons, mirroring what candidates already had for invites. Declining
sends an automatic message and closes the conversation.

**Other fixes and additions:**
- Reactions now display horizontally, not vertically
- "Cancel" buttons added next to every "Save changes" (profiles, job
  posting/editing) — discards edits and returns to the last saved version
- Photo picker redesigned: an edit-pencil overlay on existing photos
  (reposition the current one, or replace it) instead of a bare "choose
  file" button; a centered plus icon for the empty state
- New "What is Champ?" page — linked next to Settings when logged in, or
  next to Browse Open Roles on the logged-out homepage

## What's new in v18

- **Public job board** (`/jobs`) — anyone can browse open roles and
  filter them without logging in, same as any real job board. Applying
  (or seeing full details tied to an account) prompts sign-up/login.
  Linked from both the nav bar (for guests) and the homepage hero.
- **Education** section for candidates (institution, degree — chosen
  from a list — and an optional field of study), shown on their own
  profile and to companies viewing them.
- **Preferred positions** — candidates now pick the roles they're
  actually looking for (multi-select, a real list of professions) during
  onboarding or from their profile. "For You" now matches on this plus
  salary, instead of skill overlap. This field is never shown to
  companies — candidate-only, same spirit as their private "about" notes.
- **Company profile expanded**: address, phone, and multiple social
  links (choose a platform, add a link, add as many as you want) — shown
  on the public company page too, for a more professional look.
- Fixed a real bug: the chat edit/delete/react menu disappeared the
  instant your cursor crossed the small gap between the message bubble
  and the menu itself, because that gap wasn't part of either element's
  hoverable area. Fixed with a delayed-hide pattern (the standard fix for
  this exact class of UI bug) — the menu now stays put crossing that gap.
- Work Experience (and the new Education section) on the company-facing
  candidate view redesigned with a cleaner timeline layout.

**Not built this round, by design:** a real analytics/activity-tracking
backoffice (Vercel doesn't provide this automatically — it would need its
own dedicated build, either custom or via a third-party tool).

## What's new in v17

- Fixed a real bug in the route-protection middleware: it was
  unconditionally redirecting candidates away from anything under
  `/company/*`, including their own self-preview page — this is what made
  "Preview as recruiters see me" open the wrong page entirely
- Fixed: saving an edited role now returns to that role's own page,
  not the dashboard
- Position detail page: bigger stats chart with room for every status
  label, applicants list moved under the stats (not under the
  description), and a clean message when a role has no applicants yet
  instead of an empty chart
- Chat now auto-scrolls to the newest message on open, on both the
  standalone thread page and the inbox — no more scrolling down manually
- Company inbox: filters redesigned into one row of multi-select dropdowns
  (type, status, position) so you can e.g. show every status except "Not
  moving forward" at once; the position list now reflects your actual
  active postings immediately, not just ones with existing conversations
- Candidates Hub: Position and Skills filters are now real multi-select
  autocomplete fields, same as the job-browsing filters
- "All roles" and "For You" job cards redesigned: location/remote/
  employment-type together, category on its own line, then salary, then
  skills — no longer one long crowded row
- New "Hide roles I've already applied to" filter on All Roles
- Fixed: birthdate wasn't shown to companies viewing a candidate (a real
  oversight, not intentional)
- Remote/On-site now shown next to location instead of next to skills
- Lists in the rich-text editor now continue automatically when you press
  Enter, instead of needing the toolbar button clicked for every item

**Known limitation, not fixed this round:** true WYSIWYG formatting (text
that visibly looks bold/italic while you type, like Word) needs a
different kind of editor than what we have now — this is a bigger,
separate task, not a quick fix, and deserves its own dedicated round
rather than a rushed version.

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
