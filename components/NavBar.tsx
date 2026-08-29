import Link from "next/link";
import { getSession, destroySession } from "@/lib/auth";
import { Logo } from "./ui";
import { redirect } from "next/navigation";
import { countUnreadConversationsForCandidate, countUnreadConversationsForCompany } from "@/lib/queries";

async function logoutAction() {
  "use server";
  await destroySession();
  redirect("/");
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-apricot text-ink text-[10px] font-semibold">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default async function NavBar() {
  const session = await getSession();

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
        <Link href={session ? (session.role === "candidate" ? "/candidate/jobs" : "/company/dashboard") : "/"}>
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
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
      {tabs.length > 0 && (
        <div className="px-6 flex gap-5 border-t border-white/10 overflow-x-auto">
          {tabs.map(([href, label, unread]) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="text-sm py-3 text-paper/85 font-medium whitespace-nowrap hover:text-apricot flex items-center"
            >
              {label}
              <Badge count={unread} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
