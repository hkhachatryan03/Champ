"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sparkles, List, MessageCircle, User, Info, Mail, Settings, LogOut, Briefcase, Users, Inbox, Building2 } from "lucide-react";
import { Logo } from "./ui";
import NavTabs from "./NavTabs";

/**
 * The site's top navigation. Which style shows is decided HERE, in the
 * browser, from the current URL — because the root layout (which renders
 * the nav) is NOT re-rendered by Next.js when someone clicks around the
 * app, so a server-side choice would go stale after the first click.
 *
 *  - logged-out visitor on a public page  -> floating glass pill (guest)
 *  - candidate / recruiter on any page of their own area (and the shared
 *    pages)                               -> floating glass pill + tabs + account menu
 *  - anything else (e.g. the admin area)  -> the original bar, unchanged
 */

type Tab = [string, string, number];

const GUEST_PAGES = ["/about", "/jobs", "/contact", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];
// Pages every signed-in person can reach, whatever their role.
const SHARED_MODERN = ["/thread", "/settings", "/about", "/contact", "/jobs", "/companies", "/verify-email", "/verify-email-pending"];
const CANDIDATE_MODERN = ["/candidate", ...SHARED_MODERN];
const COMPANY_MODERN = ["/company", ...SHARED_MODERN];

const under = (path: string, base: string) => path === base || path.startsWith(base + "/");
const isGuestPage = (p: string) => p === "/" || GUEST_PAGES.some((b) => under(p, b));
// A candidate previewing their own profile lands on /company/candidates/<id>
const isSelfPreviewPath = (p: string) => /^\/company\/candidates\/\d+\/?$/.test(p);
const isCandidateModern = (p: string) => CANDIDATE_MODERN.some((b) => under(p, b)) || isSelfPreviewPath(p);
const isCompanyModern = (p: string) => COMPANY_MODERN.some((b) => under(p, b));

function tabIsActive(href: string, pathname: string): boolean {
  // ---- recruiter tabs ----
  if (href === "/company/dashboard") return pathname === href || under(pathname, "/company/jobs");
  if (href === "/company/candidates") return pathname === href || pathname === href + "/"; // a single candidate's page highlights nothing
  if (href === "/company/inbox") return under(pathname, href) || under(pathname, "/thread");
  if (href === "/company/profile") return under(pathname, href);
  // ---- candidate tabs ----
  if (href === "/candidate/jobs/for-you") return pathname === href;
  if (href === "/candidate/jobs") return pathname === href || (under(pathname, href) && pathname !== "/candidate/jobs/for-you");
  if (href === "/candidate/applications") return under(pathname, href) || under(pathname, "/thread");
  return under(pathname, href);
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <b className="aur-bdg">{count > 9 ? "9+" : count}</b>;
}

const DOCK_ICONS: Record<string, React.ReactNode> = {
  "/company/dashboard": <Briefcase size={19} strokeWidth={1.4} />,
  "/company/candidates": <Users size={19} strokeWidth={1.4} />,
  "/company/inbox": <Inbox size={19} strokeWidth={1.4} />,
  "/company/profile": <Building2 size={19} strokeWidth={1.4} />,
  "/candidate/jobs/for-you": <Sparkles size={19} strokeWidth={1.4} />,
  "/candidate/jobs": <List size={19} strokeWidth={1.4} />,
  "/candidate/applications": <MessageCircle size={19} strokeWidth={1.4} />,
  "/candidate/profile": <User size={19} strokeWidth={1.4} />,
};
const DOCK_LABELS: Record<string, string> = {
  "/company/dashboard": "Roles",
  "/company/candidates": "Candidates",
  "/company/inbox": "Inbox",
  "/company/profile": "Profile",
  "/candidate/jobs/for-you": "For you",
  "/candidate/jobs": "Roles",
  "/candidate/applications": "Applications",
  "/candidate/profile": "Profile",
};

function AccountMenu({ email, label, logoutAction }: { email: string; label: string; logoutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="aur-menu-wrap" ref={wrap}>
      <button
        type="button"
        className="aur-avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        {email.charAt(0).toUpperCase() || "?"}
      </button>
      <div className={`aur-menu ${open ? "open" : ""}`} role="menu">
        <div className="aur-menu-who">
          <b>{email}</b>
          <small>{label}</small>
        </div>
        <Link href="/about" role="menuitem"><Info size={16} strokeWidth={1.4} /> What is Champ?</Link>
        <Link href="/contact" role="menuitem"><Mail size={16} strokeWidth={1.4} /> Contact us</Link>
        <Link href="/settings" role="menuitem"><Settings size={16} strokeWidth={1.4} /> Settings</Link>
        <hr />
        <form action={logoutAction}>
          <button type="submit" role="menuitem" className="aur-menu-out"><LogOut size={16} strokeWidth={1.4} /> Log out</button>
        </form>
      </div>
    </div>
  );
}

export default function SiteNav({
  role,
  email,
  tabs,
  logoutAction,
}: {
  role: "candidate" | "company" | null;
  email: string;
  tabs: Tab[];
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname() || "/";

  // ---- logged-out visitor on a public page: the guest pill ----
  if (!role && isGuestPage(pathname)) {
    const active = (href: string) => (under(pathname, href) ? "is-active" : undefined);
    return (
      <div className="aur-nav">
        <Link href="/" className="aur-nav-logo">
          <Logo />
        </Link>
        <div className="aur-nav-links">
          <Link href="/about" className={active("/about")}>What is Champ?</Link>
          <Link href="/jobs" className={active("/jobs")}>Browse open roles</Link>
          <Link href="/contact" className={active("/contact")}>Contact us</Link>
        </div>
        <Link href="/login" className="aur-btn aur-btn-primary" style={{ padding: "9px 18px" }}>
          Log in
        </Link>
      </div>
    );
  }

  // ---- signed-in candidate / recruiter: pill + tabs + account menu, dock on phones ----
  if ((role === "candidate" && isCandidateModern(pathname)) || (role === "company" && isCompanyModern(pathname))) {
    return (
      <>
        <nav className="aur-nav aur-nav-app" aria-label="Main">
          <Link href={role === "company" ? "/company/dashboard" : "/candidate/jobs/for-you"} className="aur-nav-logo">
            <Logo />
          </Link>
          <div className="aur-tabs">
            {tabs.map(([href, label, unread]) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={`aur-tab ${tabIsActive(href, pathname) ? "is-on" : ""}`}
              >
                {label}
                <Badge count={unread} />
              </Link>
            ))}
          </div>
          <AccountMenu key={pathname} email={email} label={role === "company" ? "Recruiter" : "Job seeker"} logoutAction={logoutAction} /> {/* key = route: the menu closes itself on navigation */}
        </nav>
        <nav className="aur-dock" aria-label="Main">
          {tabs.map(([href, , unread]) => (
            <Link key={href} href={href} prefetch={false} className={tabIsActive(href, pathname) ? "is-on" : ""}>
              {DOCK_ICONS[href]}
              <span>{DOCK_LABELS[href]}</span>
              <Badge count={unread} />
            </Link>
          ))}
        </nav>
      </>
    );
  }

  // ---- everything else: the original bar, exactly as it was ----
  return (
    <div className="bg-ink relative z-30">
      <div className="w-full flex items-center justify-between px-6 py-4">
        <Link href={role ? (role === "candidate" ? "/candidate/jobs/for-you" : "/company/dashboard") : "/"}>
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper"
          >
            What is Champ?
          </Link>
          {!role && (
            <Link
              href="/jobs"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper"
            >
              Browse open roles
            </Link>
          )}
          {role && (
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
          {role ? (
            <form action={logoutAction}>
              <button type="submit" className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper">
                Log out
              </button>
            </form>
          ) : (
            <Link href="/login" className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-paper">
              Log in
            </Link>
          )}
        </div>
      </div>
      {tabs.length > 0 && <NavTabs tabs={tabs} />}
    </div>
  );
}
