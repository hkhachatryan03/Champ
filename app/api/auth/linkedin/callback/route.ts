import { NextRequest, NextResponse } from "next/server";
import { exchangeLinkedInCode, resolveOAuthUser } from "@/lib/oauth";

const STATE_COOKIE = "champ_li_oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const raw = request.cookies.get(STATE_COOKIE)?.value;

  const clearCookie = (response: NextResponse) => {
    response.cookies.delete(STATE_COOKIE);
    return response;
  };

  if (!code || !returnedState || !raw) {
    return clearCookie(NextResponse.redirect(new URL("/login?error=oauth", request.url)));
  }

  let saved: { state: string; mode: "login" | "signup"; role: "candidate" | "company"; recruiterType?: "company" | "agency" };
  try {
    saved = JSON.parse(raw);
  } catch {
    return clearCookie(NextResponse.redirect(new URL("/login?error=oauth", request.url)));
  }

  if (saved.state !== returnedState) {
    return clearCookie(NextResponse.redirect(new URL("/login?error=oauth", request.url)));
  }

  const redirectUri = new URL("/api/auth/linkedin/callback", request.url).toString();
  const identity = await exchangeLinkedInCode({ code, redirectUri });
  if (!identity) {
    return clearCookie(NextResponse.redirect(new URL("/login?error=oauth", request.url)));
  }

  const result = await resolveOAuthUser(identity, {
    mode: saved.mode,
    role: saved.role,
    recruiterType: saved.recruiterType,
  });

  if (result.status === "no_account") {
    return clearCookie(
      NextResponse.redirect(new URL(`/signup?role=${saved.role}&error=no_account`, request.url))
    );
  }

  return clearCookie(NextResponse.redirect(new URL(result.redirectTo, request.url)));
}
