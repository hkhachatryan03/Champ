import { getSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { countUnreadConversationsForCandidate, countUnreadConversationsForCompany, touchLastSeen } from "@/lib/queries";
import SiteNav from "./SiteNav";

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

  // Which style to show (guest pill / candidate pill / original bar) is decided
  // in the browser from the current URL — see SiteNav.tsx for why.
  return (
    <SiteNav
      role={session ? session.role : null}
      email={session?.email || ""}
      tabs={tabs}
      logoutAction={logoutAction}
    />
  );
}
