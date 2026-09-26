import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, destroyAdminSession } from "@/lib/adminAuth";
import { getPlatformOverview } from "@/lib/adminQueries";

async function adminLogoutAction() {
  "use server";
  await destroyAdminSession();
  redirect("/admin/login");
}

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/configs", label: "Configs" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Belt-and-suspenders: middleware already blocks unauthenticated requests
  // to /admin/*, but checking again here means this layout never renders
  // its (session-derived) chrome without a real admin behind it.
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const overview = await getPlatformOverview();
  const alertCount = overview.openContactMessages + overview.pendingFlags + overview.unverifiedCompanies;

  return (
    <div className="min-h-screen bg-paper-dim flex">
      <aside className="w-56 shrink-0 bg-ink text-paper flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-xs font-medium text-apricot uppercase tracking-wide">Champ</p>
          <p className="font-display font-semibold text-lg">BackOffice</p>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-5 py-2.5 text-sm text-paper/80 hover:bg-white/5 hover:text-paper"
            >
              <span>{item.label}</span>
              {item.href === "/admin/support" && overview.openContactMessages > 0 && (
                <span className="text-xs bg-apricot text-ink rounded-full px-1.5 py-0.5 font-medium">
                  {overview.openContactMessages}
                </span>
              )}
              {item.href === "/admin/moderation" &&
                overview.pendingFlags + overview.unverifiedCompanies > 0 && (
                  <span className="text-xs bg-apricot text-ink rounded-full px-1.5 py-0.5 font-medium">
                    {overview.pendingFlags + overview.unverifiedCompanies}
                  </span>
                )}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-paper/50 truncate">{session.email}</p>
          <form action={adminLogoutAction} className="mt-2">
            <button type="submit" className="text-xs text-paper/70 underline">
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
