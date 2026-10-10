import type { Metadata } from "next";
import { formatMoneyRange } from "@/lib/currency";

// ---------------------------------------------------------------------------
// Everything about how Champ pages describe themselves to search engines and
// to link previews (LinkedIn, Facebook, X, Telegram, WhatsApp…) lives here.
// ---------------------------------------------------------------------------

export const SITE_NAME = "Champ";
/** Where search engines start cutting descriptions off. */
const MAX_DESCRIPTION = 158;
export const DEFAULT_TITLE = "Champ — jobs at Armenia's tech companies, every salary visible";
/**
 * The default share image (app/opengraph-image.png, 1200×630).
 *
 * It is attached EXPLICITLY on every page by pageMetadata() below. Next.js can
 * attach the file automatically, but a page that defines its own Open Graph /
 * Twitter tags replaces the site-wide ones wholesale — image included — so
 * relying on the automatic route left every real page with no preview picture.
 */
export const SHARE_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Champ — jobs at Armenia's tech companies. Every salary visible.",
};
export const DEFAULT_DESCRIPTION =
  "Champ is a job platform built for Armenia's tech companies and the people who work there. Every listing shows a real salary range, and you message recruiters directly.";

/**
 * The public address of the site. Link previews need ABSOLUTE urls, so this must
 * be the real domain. It reuses NEXT_PUBLIC_BASE_URL (already used for the links
 * in emails), falling back to Vercel's own production-domain variable.
 */
export function getSiteUrl(): URL {
  let raw =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`; // tolerate "champ.am" without a scheme
  try {
    return new URL(raw.replace(/\/+$/, ""));
  } catch {
    return new URL("http://localhost:3000");
  }
}

/** Collapse whitespace and cut to a length search engines show, at a word boundary. */
export function clip(text: string, max = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

type PageMetaInput = {
  /** Page-specific title. "| Champ" is appended automatically (unless `absoluteTitle`). */
  title: string;
  description: string;
  /** Canonical path, e.g. "/jobs". Omit for private pages. */
  path?: string;
  /** Use the title exactly as given (the Home page already says "Champ"). */
  absoluteTitle?: boolean;
  /** Keep out of search results (private, utility and admin pages). */
  noindex?: boolean;
};

/**
 * One call gives a page its title, description, canonical link, Open Graph tags
 * and Twitter card, so they can never drift out of sync with each other.
 * (The share image comes from app/opengraph-image.png, applied site-wide.)
 */
export function pageMetadata({ title, description, path, absoluteTitle, noindex }: PageMetaInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: fullTitle,
      description,
      ...(path ? { url: path } : {}),
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: "/twitter-image.png", alt: SHARE_IMAGE.alt }],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

// ----------------------------- job pages -----------------------------------

export type JobMetaInput = {
  id: number;
  title: string;
  company_name: string;
  location: string;
  remote: number;
  employment_type: string;
  experience_level: string | null;
  salary_min: number;
  salary_max: number;
  active: number;
  archived_at: string | null;
};

const LEVEL_WORD: Record<string, { label: string; pattern: RegExp }> = {
  Junior: { label: "Junior", pattern: /\bjunior\b|\bjr\b/i },
  Mid: { label: "Mid-level", pattern: /\bmid(-|\s)?(level)?\b/i },
  Senior: { label: "Senior", pattern: /\bsenior\b|\bsr\b/i },
  Lead: { label: "Lead", pattern: /\blead\b/i },
};

/**
 * "Frontend Developer" + level "Senior" -> "Senior Frontend Developer".
 * If the title already says it ("Senior Backend Engineer"), don't repeat it.
 */
export function jobHeadline(job: Pick<JobMetaInput, "title" | "experience_level">): string {
  const title = job.title.trim();
  const level = job.experience_level ? LEVEL_WORD[job.experience_level] : undefined;
  if (!level || level.pattern.test(title)) return title;
  return `${level.label} ${title}`;
}

/** The page title for a role: "Senior Frontend Developer at LusarLabs (Remote)". */
export function jobTitleText(job: JobMetaInput): string {
  return `${jobHeadline(job)} at ${job.company_name}${job.remote ? " (Remote)" : ""}`;
}

/**
 * The search-result / link-preview description for a role.
 *
 * Built in priority order — who, what, where, how much — and the closing line
 * is only added if it fits WHOLE. Search results cut around 160 characters, and
 * a call to action sliced off mid-sentence ("Apply on…") reads worse than none.
 */
export function jobDescriptionText(job: JobMetaInput): string {
  const where = job.location ? ` in ${job.location}` : "";
  const remote = job.remote ? " (remote)" : "";
  const core =
    `${job.company_name} is hiring: ${jobHeadline(job)}${remote}${where}. ` +
    `${job.employment_type}, ${formatMoneyRange(job.salary_min, job.salary_max)}/month.`;
  for (const tail of [" Salary shown upfront — apply on Champ.", " Apply on Champ."]) {
    if ((core + tail).length <= MAX_DESCRIPTION) return core + tail;
  }
  return clip(core, MAX_DESCRIPTION);
}

/**
 * Metadata for a public job page (/jobs/[id]). Closed or paused roles stay
 * reachable (people may hold links to them) but are kept out of search results.
 */
export function buildJobMetadata(job: JobMetaInput | undefined | null): Metadata {
  if (!job) {
    return pageMetadata({ title: "Role not found", description: "This role is no longer on Champ.", noindex: true });
  }
  return pageMetadata({
    title: jobTitleText(job),
    description: jobDescriptionText(job),
    path: `/jobs/${job.id}`,
    noindex: !job.active || !!job.archived_at,
  });
}
