import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Deliberately a different cookie name AND a different secret fallback than
// the candidate/company session (lib/auth.ts). Even if SESSION_SECRET were
// ever leaked or reused, admin sessions are signed with their own secret.
const ADMIN_SESSION_COOKIE = "champ_admin_session";
const secret = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || "dev-only-admin-secret-change-me-before-deploying"
);

export type AdminSessionPayload = {
  adminId: number;
  email: string;
  name: string;
};

export async function createAdminSession(payload: AdminSessionPayload) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    // Shorter than the 30-day candidate/company session on purpose —
    // this account can moderate and edit the whole platform.
    .setExpirationTime("12h")
    .sign(secret);

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export { ADMIN_SESSION_COOKIE, secret as adminSecret };
