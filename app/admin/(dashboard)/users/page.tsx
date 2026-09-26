import Link from "next/link";
import { listUsers, countUsers } from "@/lib/adminQueries";

const PAGE_SIZE = 30;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; page?: string }>;
}) {
  const { role = "", q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const roleFilter = role === "candidate" || role === "company" ? role : "";
  const [users, total] = await Promise.all([
    listUsers({ role: roleFilter, search: q, limit: PAGE_SIZE, offset }),
    countUsers({ role: roleFilter, search: q }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Users</h1>
      <p className="text-sm text-muted mt-1">{total} total</p>

      <form className="flex gap-2 mt-5" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white"
        />
        <select
          name="role"
          defaultValue={roleFilter}
          className="px-3 py-2 rounded-lg border border-line text-sm bg-white"
        >
          <option value="">All roles</option>
          <option value="candidate">Candidates</option>
          <option value="company">Companies</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-lg bg-apricot text-ink text-sm font-medium">
          Search
        </button>
      </form>

      <div className="mt-5 rounded-xl border border-line bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-paper-dim">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                    {u.name || "(no name yet)"}
                  </Link>
                  {u.flag_count > 0 && (
                    <span className="ml-2 text-xs bg-apricot/20 text-apricot-deep rounded-full px-1.5 py-0.5">
                      {u.flag_count} flag{u.flag_count > 1 ? "s" : ""}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  {u.role === "company" && (
                    <span className={u.verified ? "text-moss" : "text-muted"}>
                      {u.verified ? "Verified" : "Unverified"}
                    </span>
                  )}
                  {!u.onboarded && <span className="text-muted ml-1">· Onboarding incomplete</span>}
                </td>
                <td className="px-4 py-3 text-muted">{u.created_at?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-muted">{u.last_seen_at?.slice(0, 10) || "—"}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No users match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-4 text-sm">
          {pageNum > 1 && (
            <Link
              href={`/admin/users?role=${roleFilter}&q=${encodeURIComponent(q)}&page=${pageNum - 1}`}
              className="underline text-muted"
            >
              ← Previous
            </Link>
          )}
          <span className="text-muted">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages && (
            <Link
              href={`/admin/users?role=${roleFilter}&q=${encodeURIComponent(q)}&page=${pageNum + 1}`}
              className="underline text-muted"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
