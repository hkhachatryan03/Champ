import { NextRequest, NextResponse } from "next/server";
import { buildLinkedInAuthUrl, isLinkedInConfigured } from "@/lib/oauth";

const STATE_COOKIE = "champ_li_oauth";

export async function GET(request: NextRequest) {
  if (!isLinkedInConfigured()) {
    return NextResponse.redirect(new URL("/login?error=oauth_unavailable", request.url));
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const role = searchParams.get("role") === "company" ? "company" : "candidate";
  const recruiterType = searchParams.get("recruiterType") === "agency" ? "agency" : "company";

  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/auth/linkedin/callback", request.url).toString();

  const response = NextResponse.redirect(buildLinkedInAuthUrl({ redirectUri, state }));
  // Short-lived, httpOnly — only round-trips through LinkedIn and back to
  // our own callback, never read by client JS.
  response.cookies.set(STATE_COOKIE, JSON.stringify({ state, mode, role, recruiterType }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
