import { normalizeAndRegisterTerms } from "@/lib/queries";
import { formatTermCasing } from "@/lib/termCasing";
import type { JobFields } from "@/lib/jobFields";

// Turns validated form fields into what the database stores.
//
// Skills get consistent capitalisation either way. But only a role that is
// actually being PUBLISHED adds its skills to the shared suggestion list that
// everyone sees — a draft is private, so nothing in it should leak into
// anyone else's suggestions yet.
export async function toJobRecord(fields: JobFields, { registerTerms }: { registerTerms: boolean }) {
  const skills = registerTerms
    ? await normalizeAndRegisterTerms("skill", fields.skills)
    : fields.skills.map(formatTermCasing);
  return { ...fields, skills: JSON.stringify(skills), languages: JSON.stringify(fields.languages) };
}
