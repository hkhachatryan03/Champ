import { cache } from "react";
import { getJobWithCompany } from "@/lib/queries";

// A page and its generateMetadata() both need the same job. React's cache()
// makes them share ONE database query per request instead of two.
export const getJobCached = cache(getJobWithCompany);

/** "42" -> 42; anything that isn't a whole number -> null (never hits the database). */
export function parseJobId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
