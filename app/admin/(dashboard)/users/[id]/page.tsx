import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUserDetail, flagAccount, setCompanyVerified, resolveAccountFlag } from "@/lib/adminQueries";
import { getAdminSession } from "@/lib/adminAuth";

async function flagAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const userId = Number(formData.get("userId"));
  const reason = String(formData.get("reason") || "").trim();
  if (!reason) redirect(`/admin/users/${userId}`);
  await flagAccount(userId, reason, session!.email);
  redirect(`/admin/users/${userId}`);
}

async function resolveFlagAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const flagId = Number(formData.get("flagId"));
  const userId = Number(formData.get("userId"));
  await resolveAccountFlag(flagId, session!.email);
  redirect(`/admin/users/${userId}`);
}

async function toggleVerifiedAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const userId = Number(formData.get("userId"));
  const nextVerified = formData.get("nextVerified") === "1";
  await setCompanyVerified(userId, nextVerified, session!.email);
  redirect(`/admin/users/${userId}`);
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getUserDetail(Number(id));
  if (!detail) notFound();

  const { user, profile, flags, statCount } = detail;
  const openFlags = flags.filter((f: any) => !f.resolved);
  const pastFlags = flags.filter((f: any) => f.resolved);

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-muted underline">
        ← Back to Users
      </Link>

      <div className="flex items-start justify-between mt-4">
        <div>
          <h1 className="font-display font-semibold text-2xl">{profile?.name || "(no name yet)"}</h1>
          <p className="text-sm text-muted mt-1">
            {user.email} · <span className="capitalize">{user.role}</span> · joined {user.created_at?.slice(0, 10)}
          </p>
        </div>
        {user.role === "company" && (
          <form action={toggleVerifiedAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="nextVerified" value={profile?.verified ? "0" : "1"} />
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                profile?.verified ? "bg-ink/8 text-muted" : "bg-moss text-white"
              }`}
            >
              {profile?.verified ? "Remove verification" : "Mark as verified"}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 rounded-xl border border-line bg-white">
          <p className="text-xs text-muted">
            {user.role === "candidate" ? "Applications sent" : "Jobs posted"}
          </p>
          <p className="font-display font-semibold text-2xl mt-1">{statCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-line bg-white">
          <p className="text-xs text-muted">Last active</p>
          <p className="font-display font-semibold text-2xl mt-1">{user.last_seen_at?.slice(0, 10) || "—"}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-medium text-sm text-muted uppercase tracking-wide">Flags</h2>

        {openFlags.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            {openFlags.map((f: any) => (
              <div key={f.id} className="p-4 rounded-xl border border-apricot/30 bg-apricot/5">
                <p className="text-sm">{f.reason}</p>
                <p className="text-xs text-muted mt-1">
                  Flagged by {f.flagged_by || "unknown"} on {f.created_at?.slice(0, 10)}
                </p>
                <form action={resolveFlagAction} className="mt-2">
                  <input type="hidden" name="flagId" value={f.id} />
                  <input type="hidden" name="userId" value={user.id} />
                  <button type="submit" className="text-xs underline text-muted">
                    Mark resolved
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
        {openFlags.length === 0 && <p className="text-sm text-muted mt-2">No open flags on this account.</p>}

        <form action={flagAction} className="flex gap-2 mt-4">
          <input type="hidden" name="userId" value={user.id} />
          <input
            name="reason"
            placeholder="Flag this account for…"
            className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-ink text-paper text-sm font-medium">
            Flag account
          </button>
        </form>

        {pastFlags.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-muted cursor-pointer">
              {pastFlags.length} resolved flag{pastFlags.length > 1 ? "s" : ""}
            </summary>
            <div className="flex flex-col gap-2 mt-2">
              {pastFlags.map((f: any) => (
                <div key={f.id} className="p-3 rounded-lg border border-line text-xs text-muted">
                  {f.reason} — flagged by {f.flagged_by}, resolved by {f.resolved_by} on{" "}
                  {f.resolved_at?.slice(0, 10)}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
