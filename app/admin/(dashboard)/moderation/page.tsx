import Link from "next/link";
import { redirect } from "next/navigation";
import { listAccountFlags, resolveAccountFlag, listUnverifiedCompanies, setCompanyVerified } from "@/lib/adminQueries";
import { getAdminSession } from "@/lib/adminAuth";

async function resolveFlagAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  await resolveAccountFlag(Number(formData.get("flagId")), session!.email);
  redirect("/admin/moderation");
}

async function verifyCompanyAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  await setCompanyVerified(Number(formData.get("userId")), true, session!.email);
  redirect("/admin/moderation");
}

export default async function AdminModerationPage() {
  const [flags, unverified] = await Promise.all([listAccountFlags(false), listUnverifiedCompanies()]);

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Moderation</h1>
      <p className="text-sm text-muted mt-1">
        Flagged accounts and companies waiting on verification.
      </p>

      <div className="mt-8">
        <h2 className="font-medium text-sm text-muted uppercase tracking-wide">
          Flagged accounts ({flags.length})
        </h2>
        <div className="flex flex-col gap-2 mt-3">
          {flags.map((f: any) => (
            <div key={f.id} className="p-4 rounded-xl border border-apricot/30 bg-apricot/5 flex items-start justify-between gap-4">
              <div>
                <Link href={`/admin/users/${f.user_id}`} className="font-medium hover:underline">
                  {f.name || f.email}
                </Link>
                <span className="text-xs text-muted ml-2 capitalize">{f.role}</span>
                <p className="text-sm mt-1">{f.reason}</p>
                <p className="text-xs text-muted mt-1">
                  Flagged by {f.flagged_by || "unknown"} on {f.created_at?.slice(0, 10)}
                </p>
              </div>
              <form action={resolveFlagAction}>
                <input type="hidden" name="flagId" value={f.id} />
                <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-white border border-line whitespace-nowrap">
                  Mark resolved
                </button>
              </form>
            </div>
          ))}
          {flags.length === 0 && <p className="text-sm text-muted">No open flags — nice and quiet.</p>}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-medium text-sm text-muted uppercase tracking-wide">
          Companies awaiting verification ({unverified.length})
        </h2>
        <div className="flex flex-col gap-2 mt-3">
          {unverified.map((c: any) => (
            <div key={c.user_id} className="p-4 rounded-xl border border-line bg-white flex items-start justify-between gap-4">
              <div>
                <Link href={`/admin/users/${c.user_id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
                <p className="text-sm text-muted mt-1">{c.email}</p>
                <p className="text-xs text-muted mt-1">
                  {c.industry || "No industry set"} · {c.website || "No website"} · signed up{" "}
                  {c.user_created_at?.slice(0, 10)}
                </p>
              </div>
              <form action={verifyCompanyAction}>
                <input type="hidden" name="userId" value={c.user_id} />
                <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-moss text-white whitespace-nowrap">
                  Verify
                </button>
              </form>
            </div>
          ))}
          {unverified.length === 0 && <p className="text-sm text-muted">Every onboarded company is verified.</p>}
        </div>
      </div>
    </div>
  );
}
