import { sanitizeRichText } from "@/lib/sanitize";

// Reading a job form and deciding whether it may be PUBLISHED. Kept free of
// any database code so the rules can be tested directly.
//
// Two ways to submit the same form:
//   "draft"   — save what's there, however unfinished. Only the owner sees it.
//   "publish" — go live. Everything candidates rely on must be present.

export type JobIntent = "draft" | "publish";

export type JobFields = {
  title: string;
  category: "Tech" | "Non-tech";
  employment_type: "Full-time" | "Part-time";
  location: string;
  remote: number;
  salary_min: number;
  salary_max: number;
  skills: string[];
  description: string;
  experience_level: string | null;
  languages: string[];
  client_name: string;
};

export function readIntent(formData: FormData): JobIntent {
  return formData.get("intent") === "draft" ? "draft" : "publish";
}

const list = (raw: FormDataEntryValue | null) =>
  String(raw || "").split(",").map((s) => s.trim()).filter(Boolean);

// Whole, non-negative amounts only — anything else becomes 0 ("not set").
const amount = (raw: FormDataEntryValue | null) => {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function readJobFields(formData: FormData): JobFields {
  const category = String(formData.get("category") || "");
  const employment = String(formData.get("employmentType") || "");
  return {
    title: String(formData.get("title") || "").trim(),
    category: category === "Non-tech" ? "Non-tech" : "Tech",
    employment_type: employment === "Part-time" ? "Part-time" : "Full-time",
    location: String(formData.get("location") || "").trim(),
    remote: formData.get("remote") ? 1 : 0,
    salary_min: amount(formData.get("salaryMin")),
    salary_max: amount(formData.get("salaryMax")),
    skills: list(formData.get("skills")),
    description: sanitizeRichText(String(formData.get("description") || "")),
    experience_level: String(formData.get("experienceLevel") || "").trim() || null,
    languages: list(formData.get("languages")),
    client_name: String(formData.get("clientName") || "").trim(),
  };
}

/** Why this can't be published yet — or null if it's ready. */
export function publishError(f: JobFields): string | null {
  if (!f.title) return "Give the role a title before posting.";
  if (!f.location) return "Pick a location before posting.";
  if (!f.description.replace(/<[^>]*>/g, "").trim()) return "A description is required.";
  if (f.salary_min <= 0 || f.salary_max <= 0) {
    return "Add a salary range before posting — it's required for every role on Champ.";
  }
  if (f.salary_max < f.salary_min) return "Max salary needs to be greater than or equal to min salary.";
  return null;
}
