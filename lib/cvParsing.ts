// Must import this before "pdf-parse" itself — Next.js bundles the server
// in a way that pdf-parse's worker file can't find on its own otherwise.
// This is the library's own documented fix for Next.js/Vercel deployments:
// https://github.com/mehmet-kozan/pdf-parse/blob/main/docs/troubleshooting.md
import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

PDFParse.setWorker(getPath());

// Best-effort CV parsing. This is intentionally simple: real resumes vary
// wildly in layout, and a scanned/image-only PDF won't have any extractable
// text at all. When guessing fails, we return null and the person just
// fills the field in manually — this never blocks onboarding.
export async function extractTextFromPdf(buffer: Buffer): Promise<string | null> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || null;
  } catch (e) {
    console.error("PDF extraction failed:", e);
    return null;
  }
}

const SKIP_WORDS = [
  "resume",
  "curriculum vitae",
  "cv",
  "contact",
  "email",
  "phone",
  "address",
  "profile",
  "summary",
  "objective",
  "experience",
  "education",
  "skills",
  "projects",
  "about",
  "linkedin",
  "github",
  "portfolio",
  "www.",
  "http",
];

// A real name is 2-4 words, each starting with a capital letter (or fully
// capitalized, e.g. "HAYK KHACHATRYAN") — this is much stricter than just
// "2-4 words with no digits," which was matching things like job titles
// or section headers instead of an actual name.
const NAME_WORD = /^[A-ZԱ-Ֆ][a-zա-ֆ]*$|^[A-ZԱ-Ֆ]+$/u;

function looksLikeName(line: string): boolean {
  if (line.includes("@") || /\d/.test(line)) return false;
  if (line.length > 40) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  return words.every((w) => NAME_WORD.test(w));
}

export function guessNameFromText(text: string | null): string | null {
  if (!text) return null;
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Widened from 6 to 15 lines: resumes often have a logo, a decorative
  // rule, or contact icons that extract as near-empty lines before the
  // actual name line.
  for (const line of lines.slice(0, 15)) {
    const lower = line.toLowerCase();
    if (SKIP_WORDS.some((w) => lower.includes(w))) continue;
    if (looksLikeName(line)) return line;
  }
  return null;
}

// Fallback for when the text itself doesn't yield a confident guess (e.g.
// a resume built with a template that lays out the name as a graphic, or
// splits it across multiple text fragments in a way that breaks line
// extraction). Many people still name the file after themselves, e.g.
// "CVHaykKhachatryan.pdf" or "Hayk_Khachatryan_Resume.pdf" — worth trying
// before giving up entirely.
export function guessNameFromFilename(filename: string): string | null {
  let base = filename.replace(/\.[a-zA-Z0-9]+$/, ""); // strip extension
  base = base.replace(/^\d+_\d+_/, ""); // strip our own upload prefix (userId_timestamp_)

  // Split into words: camelCase boundaries (including an acronym-style
  // prefix like "CVHayk" → "CV Hayk") AND underscores/dashes/dots/spaces.
  const rawWords = base
    .replace(/([a-zա-ֆ])([A-ZԱ-Ֆ])/gu, "$1 $2")
    .replace(/([A-ZԱ-Ֆ]+)([A-ZԱ-Ֆ][a-zա-ֆ])/gu, "$1 $2")
    .split(/[\s_\-.]+/)
    .filter(Boolean);

  const STOP = new Set(["cv", "resume", "curriculum", "vitae", "final", "document", "doc", "file", "copy"]);
  const words = rawWords.filter((w) => /^[A-Za-zԱ-Ֆա-ֆ]+$/u.test(w) && !STOP.has(w.toLowerCase()));

  if (words.length < 2 || words.length > 4) return null;
  const titleCased = words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
  return titleCased.join(" ");
}

// Best-effort guess from a LinkedIn URL's vanity slug (e.g.
// "linkedin.com/in/hayk-khachatryan-8a2b31" -> "Hayk Khachatryan"). We
// can't fetch real profile data without LinkedIn's official API (which
// needs a partnership we don't have), but the slug itself is public and
// often just is the person's name — worth extracting rather than leaving
// the name field blank.
export function guessNameFromLinkedinUrl(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (!match) return null;
  let slug = decodeURIComponent(match[1]);
  // Strip a trailing random ID segment, e.g. "-8a2b31c4" or "-123456789".
  slug = slug.replace(/-[a-z0-9]{6,}$/i, "");
  const words = slug
    .split(/[-_]+/)
    .filter(Boolean)
    .filter((w) => /^[A-Za-zԱ-Ֆա-ֆ]+$/u.test(w));
  if (words.length < 2 || words.length > 4) return null;
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

// Combines both strategies: prefer a confident match from the document's
// own text, since that's more likely correct; fall back to the filename
// only if the text didn't yield anything.
export function guessName(text: string | null, filename: string): string | null {
  return guessNameFromText(text) || guessNameFromFilename(filename);
}
