import { NextRequest, NextResponse } from "next/server";
import { verifyGoogleIdToken, resolveOAuthUser } from "@/lib/oauth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    credential?: string;
    mode?: "login" | "signup";
    role?: "candidate" | "company";
    recruiterType?: "company" | "agency";
  } | null;

  if (!body?.credential) {
    return NextResponse.json({ ok: false, error: "missing_credential" }, { status: 400 });
  }

  const identity = await verifyGoogleIdToken(body.credential);
  if (!identity) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const result = await resolveOAuthUser(identity, {
    mode: body.mode === "signup" ? "signup" : "login",
    role: body.role,
    recruiterType: body.recruiterType,
  });

  if (result.status === "no_account") {
    return NextResponse.json({ ok: false, error: "no_account" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, redirectTo: result.redirectTo });
}
