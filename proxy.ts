import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "champ_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-only-secret-change-me-before-deploying"
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isCandidateArea = pathname.startsWith("/candidate");
  const isCompanyArea = pathname.startsWith("/company");
  if (!isCandidateArea && !isCompanyArea) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = (payload as any).role;
    if (isCandidateArea && role !== "candidate") {
      return NextResponse.redirect(new URL("/company/dashboard", req.url));
    }
    if (isCompanyArea && role !== "company") {
      return NextResponse.redirect(new URL("/candidate/jobs", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/candidate/:path*", "/company/:path*"],
};
