import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "champ_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-only-secret-change-me-before-deploying"
);

const ADMIN_SESSION_COOKIE = "champ_admin_session";
const adminSecret = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || "dev-only-admin-secret-change-me-before-deploying"
);

async function guardAdminArea(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Tag the request so the root layout knows to skip the public NavBar —
  // the BackOffice has its own header/nav, on every /admin page including login.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-area", "1");
  const allow = () => NextResponse.next({ request: { headers: requestHeaders } });

  // The login page itself must stay reachable, or nobody could ever sign in.
  if (pathname === "/admin/login") return allow();

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  try {
    await jwtVerify(token, adminSecret);
    return allow();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isCandidateArea = pathname.startsWith("/candidate");
  const isCompanyArea = pathname.startsWith("/company");
  const isAdminArea = pathname.startsWith("/admin");

  if (isAdminArea) return guardAdminArea(req);
  if (!isCandidateArea && !isCompanyArea) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = (payload as any).role;
    const userId = (payload as any).userId;

    if (isCandidateArea && role !== "candidate") {
      return NextResponse.redirect(new URL("/company/dashboard", req.url));
    }
    if (isCompanyArea && role !== "company") {
      // Special case: a candidate is allowed to view their OWN self-preview
      // page (how recruiters see them) — everything else under /company
      // still redirects away as before.
      const selfPreviewMatch = pathname.match(/^\/company\/candidates\/(\d+)$/);
      if (role === "candidate" && selfPreviewMatch && Number(selfPreviewMatch[1]) === userId) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/candidate/jobs/for-you", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/candidate/:path*", "/company/:path*", "/admin/:path*"],
};
