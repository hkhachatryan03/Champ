import Link from "next/link";
import { getPlatformOverview } from "@/lib/adminQueries";

function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="p-5 rounded-2xl border border-line bg-white">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display font-semibold text-3xl mt-1">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function AdminOverviewPage() {
  const o = await getPlatformOverview();

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Overview</h1>
      <p className="text-sm text-muted mt-1">A snapshot of everything happening on Champ right now.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard label="Candidates" value={o.candidates} href="/admin/users?role=candidate" />
        <StatCard label="Companies" value={o.companies} href="/admin/users?role=company" />
        <StatCard label="Active jobs" value={o.activeJobs} href="/admin/jobs?status=active" />
        <StatCard label="Applications sent" value={o.applications} href="/admin/applications" />
      </div>

      {(o.openContactMessages > 0 || o.pendingFlags > 0 || o.unverifiedCompanies > 0) && (
        <div className="mt-8">
          <h2 className="font-medium text-sm text-muted uppercase tracking-wide">Needs your attention</h2>
          <div className="flex flex-col gap-2 mt-3">
            {o.openContactMessages > 0 && (
              <Link
                href="/admin/support"
                className="flex items-center justify-between p-4 rounded-xl border border-line bg-white hover:bg-paper-dim"
              >
                <span className="text-sm">Open Contact Us submissions</span>
                <span className="text-xs bg-apricot text-ink rounded-full px-2 py-0.5 font-medium">
                  {o.openContactMessages}
                </span>
              </Link>
            )}
            {o.pendingFlags > 0 && (
              <Link
                href="/admin/moderation"
                className="flex items-center justify-between p-4 rounded-xl border border-line bg-white hover:bg-paper-dim"
              >
                <span className="text-sm">Flagged accounts awaiting review</span>
                <span className="text-xs bg-apricot text-ink rounded-full px-2 py-0.5 font-medium">
                  {o.pendingFlags}
                </span>
              </Link>
            )}
            {o.unverifiedCompanies > 0 && (
              <Link
                href="/admin/moderation"
                className="flex items-center justify-between p-4 rounded-xl border border-line bg-white hover:bg-paper-dim"
              >
                <span className="text-sm">Companies awaiting verification</span>
                <span className="text-xs bg-apricot text-ink rounded-full px-2 py-0.5 font-medium">
                  {o.unverifiedCompanies}
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/analytics" className="text-sm underline text-muted">
          View full analytics →
        </Link>
      </div>
    </div>
  );
}
