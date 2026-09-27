import { OAuth2Client } from "google-auth-library";
import sql from "@/lib/db";
import { createSession } from "@/lib/auth";
import { provisionCompanyProfile } from "@/lib/companyMembership";
import { sendTeamJoinRequestEmail } from "@/lib/email";

export type OAuthProvider = "google" | "linkedin";

export type OAuthIdentity = {
  provider: OAuthProvider;
  sub: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

// --- Google -----------------------------------------------------------

// This is the *public* client ID (safe to expose — Google's identity
// button needs it in the browser). Verifying an ID token only needs the
// client ID as the expected audience, never a secret.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export function isGoogleConfigured() {
  return Boolean(GOOGLE_CLIENT_ID);
}

export async function verifyGoogleIdToken(idToken: string): Promise<OAuthIdentity | null> {
  if (!googleClient) return null;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) return null;
    return {
      provider: "google",
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || "",
      avatarUrl: payload.picture || null,
    };
  } catch {
    return null;
  }
}

// --- LinkedIn -----------------------------------------------------------
// Self-serve "Sign in with LinkedIn using OpenID Connect" — only ever
// returns identity (name, email, photo), never work history. That data
// still has to come from CV upload or manual entry.

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export function isLinkedInConfigured() {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

export function buildLinkedInAuthUrl(opts: { redirectUri: string; state: string }) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID || "",
    redirect_uri: opts.redirectUri,
    scope: "openid profile email",
    state: opts.state,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLinkedInCode(opts: {
  code: string;
  redirectUri: string;
}): Promise<OAuthIdentity | null> {
  try {
    const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: opts.code,
        redirect_uri: opts.redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }),
    });
    if (!tokenRes.ok) return null;
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) return null;

    const userRes = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!userRes.ok) return null;
    const user = (await userRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    if (!user.sub || !user.email) return null;

    return {
      provider: "linkedin",
      sub: user.sub,
      email: user.email.toLowerCase(),
      name: user.name || "",
      avatarUrl: user.picture || null,
    };
  } catch {
    return null;
  }
}

// --- Shared account resolution -----------------------------------------

type UserRow = { id: number; email: string; role: "candidate" | "company" };

async function findUserBySub(provider: OAuthProvider, sub: string): Promise<UserRow | undefined> {
  const rows = (
    provider === "google"
      ? await sql`SELECT id, email, role FROM users WHERE google_sub = ${sub}`
      : await sql`SELECT id, email, role FROM users WHERE linkedin_sub = ${sub}`
  ) as UserRow[];
  return rows[0];
}

async function linkProviderToUser(userId: number, provider: OAuthProvider, sub: string) {
  if (provider === "google") {
    await sql`UPDATE users SET google_sub = ${sub} WHERE id = ${userId}`;
  } else {
    await sql`UPDATE users SET linkedin_sub = ${sub} WHERE id = ${userId}`;
  }
}

function dashboardPathFor(role: "candidate" | "company") {
  return role === "candidate" ? "/candidate/jobs" : "/company/dashboard";
}

export type ResolveResult =
  | { status: "logged_in"; redirectTo: string }
  | { status: "no_account" };

// Finds-or-creates a user for an OAuth identity and starts their session.
//
// NOTE: today's schema still enforces one account per email address
// (a single `users` row, one `role`) — it does not yet support the same
// email holding an independent candidate account AND recruiter account.
// That's a deliberate follow-up change (touches the unique constraint on
// `users.email` and every query that assumes one row per email), not
// something folded into this pass. Until then, linking here follows the
// existing one-account-per-email behavior.
export async function resolveOAuthUser(
  identity: OAuthIdentity,
  opts: { mode: "login" | "signup"; role?: "candidate" | "company"; recruiterType?: "company" | "agency" }
): Promise<ResolveResult> {
  const existingBySub = await findUserBySub(identity.provider, identity.sub);
  if (existingBySub) {
    await createSession({ userId: existingBySub.id, role: existingBySub.role, email: existingBySub.email });
    return { status: "logged_in", redirectTo: dashboardPathFor(existingBySub.role) };
  }

  const byEmailRows = (await sql`
    SELECT id, email, role FROM users WHERE email = ${identity.email}
  `) as UserRow[];
  const byEmail = byEmailRows[0];
  if (byEmail) {
    await linkProviderToUser(byEmail.id, identity.provider, identity.sub);
    await createSession({ userId: byEmail.id, role: byEmail.role, email: byEmail.email });
    return { status: "logged_in", redirectTo: dashboardPathFor(byEmail.role) };
  }

  if (opts.mode === "login") {
    return { status: "no_account" };
  }

  const role: "candidate" | "company" = opts.role === "company" ? "company" : "candidate";
  let userId: number;
  if (identity.provider === "google") {
    const rows = await sql`
      INSERT INTO users (email, password_hash, role, email_verified, auth_provider, google_sub)
      VALUES (${identity.email}, NULL, ${role}, 1, 'google', ${identity.sub})
      RETURNING id
    `;
    userId = Number(rows[0].id);
  } else {
    const rows = await sql`
      INSERT INTO users (email, password_hash, role, email_verified, auth_provider, linkedin_sub)
      VALUES (${identity.email}, NULL, ${role}, 1, 'linkedin', ${identity.sub})
      RETURNING id
    `;
    userId = Number(rows[0].id);
  }

  if (role === "candidate") {
    await sql`
      INSERT INTO candidate_profiles (user_id, name, avatar_url)
      VALUES (${userId}, ${identity.name}, ${identity.avatarUrl})
    `;
    await createSession({ userId, role, email: identity.email });
    return { status: "logged_in", redirectTo: "/candidate/onboarding" };
  }

  const recruiterType = opts.recruiterType === "agency" ? "agency" : "company";
  const result = await provisionCompanyProfile(userId, identity.email, recruiterType, {
    name: identity.name,
    avatarUrl: identity.avatarUrl,
  });
  if (result.joinedExistingCompany && result.reviewStatus === "pending_team") {
    await sendTeamJoinRequestEmail(identity.email);
  }

  await createSession({ userId, role, email: identity.email });
  // Team joiners already have onboarded=1 (shared fields copied from the
  // owner) — send them straight to their pending status instead of asking
  // them to redo the company profile form.
  return {
    status: "logged_in",
    redirectTo: result.joinedExistingCompany ? "/company/pending" : "/company/onboarding",
  };
}
