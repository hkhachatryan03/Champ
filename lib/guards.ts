import { redirect } from "next/navigation";
import { getCandidateProfile, getCompanyProfile } from "./queries";

// Without these, a candidate or company could sign up, then jump straight
// to browsing/posting/dashboard pages by URL, skipping the "required"
// fields entirely — since HTML `required` attributes only stop a normal
// form submission, not direct navigation to a later page.
//
// They also handle a stale session: if the database was reset (e.g. a
// fresh unzip of a new version) while an old login cookie is still in the
// browser, the cookie can reference a user ID that no longer exists. In
// that case we send them back to log in — we can't clear the stale cookie
// from here (Next.js only allows modifying cookies from a Server Action or
// Route Handler, not from a page render), but logging in again overwrites
// it with a fresh, valid one.
export async function requireOnboardedCandidate(userId: number) {
  const profile = await getCandidateProfile(userId);
  if (!profile) {
    redirect("/login?error=session");
  }
  if (!profile.onboarded) redirect("/candidate/onboarding");
  return profile;
}

export async function requireOnboardedCompany(userId: number) {
  const profile = await getCompanyProfile(userId);
  if (!profile) {
    redirect("/login?error=session");
  }
  if (!profile.onboarded) redirect("/company/onboarding");
  return profile;
}
