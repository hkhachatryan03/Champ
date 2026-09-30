import { getSession } from "@/lib/auth";

/**
 * Shared shell for the public guest pages: the living aurora backdrop
 * (fixed to the viewport) with page content layered above it.
 * Pure presentation — no data, no behaviour.
 *
 * --nav-h is the space the page must leave for the nav: logged-out visitors
 * get the floating pill nav (fixed, out of flow), so pages need top padding;
 * logged-in users keep the normal in-flow bar, so they need none.
 *
 * Note: uses overflow-x-clip (not overflow-hidden) so sticky children —
 * the jobs filter panel and the job-detail sidebar — keep working.
 */
export default async function GuestPage({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div
      className="aur-page relative overflow-x-clip bg-ink min-h-screen text-paper"
      style={{ "--nav-h": session ? "0px" : "5.5rem" } as React.CSSProperties}
    >
      <div className="aur-mesh">
        <div className="aur-blade aur-blade1" />
        <div className="aur-blade aur-blade2" />
        <div className="aur-blade aur-blade3" />
      </div>
      <div className="aur-vignette" />
      <div className="aur-grain" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
