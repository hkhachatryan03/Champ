import sql from "@/lib/db";

// Common free/consumer email providers — a recruiter signing up with one
// of these isn't blocked, just flagged for extra scrutiny during Champ's
// review (self_attested = true), since we can't infer a real business
// domain from it. Not exhaustive, but covers the overwhelming majority.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.ru",
  "yandex.com",
  "yandex.ru",
]);

export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).toLowerCase();
}

export function isCorporateEmail(email: string): boolean {
  const domain = emailDomain(email);
  return Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain);
}

export type RecruiterType = "company" | "agency";

type OwnerRow = {
  user_id: number;
  name: string;
  industry: string;
  size: string;
  website: string;
  about: string;
  avatar_url: string | null;
  recruiter_type: RecruiterType;
  self_attested: number;
  review_status: "pending" | "pending_team" | "approved" | "rejected";
};

export type ProvisionResult = {
  joinedExistingCompany: boolean;
  reviewStatus: "pending" | "pending_team" | "approved";
};

// Creates the company_profiles row for a brand-new company account —
// candidate signup never touches this. Handles all three signup paths
// (password, Google, LinkedIn) identically since they all end up calling
// this with an email + chosen recruiter type.
export async function provisionCompanyProfile(
  userId: number,
  email: string,
  recruiterType: RecruiterType,
  prefill?: { name?: string; avatarUrl?: string | null }
): Promise<ProvisionResult> {
  const domain = emailDomain(email);
  const selfAttested = !isCorporateEmail(email);

  // Look for the founding/owner row of a company on the same domain.
  // Rejected companies are deliberately excluded — a rejected domain
  // starts fresh rather than reopening the old ticket (per design).
  const owners = (
    domain
      ? ((await sql`
          SELECT user_id, name, industry, size, website, about, avatar_url,
                 recruiter_type, self_attested, review_status
          FROM company_profiles
          WHERE domain = ${domain} AND team_owner_user_id IS NULL
            AND review_status IN ('approved', 'pending')
          ORDER BY (review_status = 'approved') DESC
          LIMIT 1
        `) as OwnerRow[])
      : []
  );
  const owner = owners[0];

  if (owner) {
    const reviewStatus: "pending" | "pending_team" =
      owner.review_status === "approved" ? "pending_team" : "pending";

    await sql`
      INSERT INTO company_profiles
        (user_id, name, industry, size, website, about, avatar_url,
         domain, recruiter_type, self_attested, team_owner_user_id,
         member_role, review_status, onboarded)
      VALUES
        (${userId}, ${owner.name}, ${owner.industry}, ${owner.size}, ${owner.website}, ${owner.about},
         ${owner.avatar_url}, ${domain}, ${owner.recruiter_type}, ${owner.self_attested},
         ${owner.user_id}, 'member', ${reviewStatus}, 1)
    `;
    return { joinedExistingCompany: true, reviewStatus };
  }

  await sql`
    INSERT INTO company_profiles
      (user_id, name, avatar_url, domain, recruiter_type, self_attested,
       team_owner_user_id, member_role, review_status, onboarded)
    VALUES
      (${userId}, ${prefill?.name || ""}, ${prefill?.avatarUrl ?? null}, ${domain}, ${recruiterType},
       ${selfAttested ? 1 : 0}, NULL, 'owner', 'pending', 0)
  `;
  return { joinedExistingCompany: false, reviewStatus: "pending" };
}

// ---------- Team management (owner-side, not Champ admin) ----------

export type PendingTeamMember = {
  user_id: number;
  email: string;
  recruiter_name: string;
  created_at: string;
};

export async function listPendingTeamMembers(ownerUserId: number): Promise<PendingTeamMember[]> {
  return (await sql`
    SELECT cp.user_id, u.email, cp.recruiter_name, u.created_at
    FROM company_profiles cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.team_owner_user_id = ${ownerUserId} AND cp.review_status = 'pending_team'
    ORDER BY u.created_at ASC
  `) as PendingTeamMember[];
}

async function assertBelongsToOwner(userId: number, ownerUserId: number) {
  const rows = (await sql`
    SELECT user_id FROM company_profiles WHERE user_id = ${userId} AND team_owner_user_id = ${ownerUserId}
  `) as { user_id: number }[];
  if (!rows[0]) throw new Error("Not a pending teammate of this owner");
}

export async function approveTeamMember(userId: number, ownerUserId: number, ownerEmail: string) {
  await assertBelongsToOwner(userId, ownerUserId);
  await sql`
    UPDATE company_profiles
    SET review_status = 'approved', verified = 1,
        reviewed_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS'), reviewed_by = ${ownerEmail}
    WHERE user_id = ${userId}
  `;
}

export async function declineTeamMember(userId: number, ownerUserId: number, ownerEmail: string) {
  await assertBelongsToOwner(userId, ownerUserId);
  await sql`
    UPDATE company_profiles
    SET review_status = 'rejected', verified = 0,
        rejection_reason = 'Declined by your team owner',
        reviewed_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS'), reviewed_by = ${ownerEmail}
    WHERE user_id = ${userId}
  `;
}
