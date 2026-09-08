import Link from "next/link";
import { getSession, destroySession } from "@/lib/auth";
import { Logo } from "./ui";
import { redirect } from "next/navigation";
import { countUnreadConversationsForCandidate, countUnreadConversationsForCompany, touchLastSeen } from "@/lib/queries";
import NavTabs from "./NavTabs";

async function logoutAction() {
  "use server";
  await destroySession();
  redirect("/");
}

export default async function NavBar() {
  const session = await getSession();
  if (session) {
    // Fire-and-forget-ish: this runs on every page load, which is how we
    // track "online now" / "last active" without a separate heartbeat
    // mechanism. Cheap enough at this scale (a single indexed UPDATE).
    await touchLastSeen(session.userId);
  }

  let candUnread = 0;
  let compUnread = 0;
  if (session?.role === "candidate") {
    candUnread = await countUnreadConversationsForCandidate(session.userId);
  } else if (session?.role === "company") {
    compUnread = await countUnreadConversationsForCompany(session.userId);
  }

  const candTabs: [string, string, number][] = [
    ["/candidate/jobs/for-you", "For you", 0],
    ["/candidate/jobs", "All roles", 0],
    ["/candidate/applications", "My applications", candUnread],
    ["/candidate/profile", "My profile", 0],
  ];
  const compTabs: [string, string, number][] = [
    ["/company/dashboard", "My roles", 0],
    ["/company/candidates", "Candidates", 0],
    ["/company/inbox", "Inbox", compUnread],
    ["/company/profile", "My profile", 0],
  ];
  const tabs = session?.role === "candidate" ? candTabs : session?.role === "company" ? compTabs : [];

  return (
    <div className="bg-ink">
      <div className="w-full flex items-center justify-between px-6 py-4">
        <Link href={session ? (session.role === "candidate" ? "/candidate/jobs/for-you" : "/company/dashboard") : "/"}>
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper"
          >
            What is Champ?
          </Link>
          {!session && (
            <Link
              href="/jobs"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper"
            >
              Browse open roles
            </Link>
          )}
          {session && (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper"
            >
              Settings
            </Link>
          )}
          <Link
            href="/contact"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper"
          >
            Contact us
          </Link>
          {session ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
      {tabs.length > 0 && <NavTabs tabs={tabs} />}
    </div>
  );
}
