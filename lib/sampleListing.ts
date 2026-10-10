// The example role shown on the Home page and beside the login / sign-up
// forms. It is an EXAMPLE, not a live posting — keep it labelled as one.
//
// Both places read from here so they can never disagree with each other.
// The numbers are in AMD per month, like every real listing on the site.
//
// Market data: Glassdoor, "Senior Software Engineer" in Armenia — 254
// self-reported salaries as of Aug 2026; middle 50% = ~1.23M–2.20M AMD/month
// (median ~1.58M). Cross-checked against Armtal's Armenia Salary Guide, which
// puts senior engineers at roughly 1.2M–2.0M AMD/month. These are
// crowd-sourced estimates, not an official survey — refresh them
// occasionally, and update `marketSource` when you do.
//
// No source is shown on the public site (owner's decision, Oct 2026) — keep the
// origin of the figures here so it can be re-added or refreshed later.
//
// (Glassdoor's pure "Backend Engineer, Yerevan" page is based on only 7
// reports, so the broader "Senior Software Engineer" figure is used instead.)

export const SAMPLE_LISTING = {
  title: "Senior Backend Engineer",
  company: "LusarLabs",
  where: "Yerevan · Remote",
  // What this example listing offers — sits inside the market range below.
  salaryMin: 1_500_000,
  salaryMax: 2_100_000,
  tags: ["Engineering & data", "Full-time", "Go"],
  // What people in this kind of role typically earn in Armenia.
  marketMin: 1_200_000,
  marketMax: 2_200_000,
  marketLabel: "Typical for a senior software engineer in Armenia",
} as const;
