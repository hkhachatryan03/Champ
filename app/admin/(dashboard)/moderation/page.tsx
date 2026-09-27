import Link from "next/link";
import { redirect } from "next/navigation";
import {
  listAccountFlags,
  resolveAccountFlag,
  listCompaniesForReview,
  listRejectedCompanies,
  approveCompany,
  rejectCompany,
  reconsiderCompany,
} from "@/lib/adminQueries";
import { sendCompanyApprovedEmail, sendCompanyRejectedEmail } from "@/lib/email";
import { getAdminSession } from "@/lib/adminAuth";

async function resolveFlagAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  await resolveAccountFlag(Number(formData.get("flagId")), session!.email);
  redirect("/admin/moderation");
}

async function approveCompanyAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const userId = Number(formData.get("userId"));
  const email = String(formData.get("email") || "");
  await approveCompany(userId, session!.email);
  if (email) await sendCompanyApprovedEmail(email);
  redirect("/admin/moderation");
}

async function rejectCompanyAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const userId = Number(formData.get("userId"));
  const email = String(formData.get("email") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!reason) redirect("/admin/moderation");
  await rejectCompany(userId, reason, session!.email);
  if (email) await sendCompanyRejectedEmail(email, reason);
  redirect("/admin/moderation");
}

async function reconsiderCompanyAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  await reconsiderCompany(Number(formData.get("userId")), session!.email);
  redirect("/admin/moderation");
}

export default async function AdminModerationPage() {
  const [flags, pendingCompanies, rejectedCompanies] = await Promise.all([
    listAccountFlags(false),
    listCompaniesForReview(),
    listRejectedCompanies(),
  ]);

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Moderation</h1>
      <p className="text-sm text-muted mt-1">
        Flagged accounts and companies waiting on review. Teammates joining an
        already-approved company are approved by their own team, not here.
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
          Companies awaiting review ({pendingCompanies.length})
        </h2>
        <div className="flex flex-col gap-2 mt-3">
          {pendingCompanies.map((c: any) => (
            <div key={c.user_id} className="p-4 rounded-xl border border-line bg-white flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/admin/users/${c.user_id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <span className="text-xs text-muted ml-2 capitalize">{c.recruiter_type}</span>
                  {!!c.self_attested && (
                    <span className="text-xs text-apricot-deep ml-2 bg-apricot/10 px-2 py-0.5 rounded-full">
                      Self-attested — no corporate domain
                    </span>
                  )}
                  <p className="text-sm text-muted mt-1">{c.email}</p>
                  <p className="text-xs text-muted mt-1">
                    {c.industry || "No industry set"} · {c.website || "No website"} · domain: {c.domain || "n/a"} ·
                    signed up {c.user_created_at?.slice(0, 10)}
                  </p>
                  {c.proof_notes && (
                    <p className="text-xs text-muted mt-1 italic">Proof notes: {c.proof_notes}</p>
                  )}
                </div>
                <form action={approveCompanyAction}>
                  <input type="hidden" name="userId" value={c.user_id} />
                  <input type="hidden" name="email" value={c.email} />
                  <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-moss text-white whitespace-nowrap">
                    Approve
                  </button>
                </form>
              </div>
              <form action={rejectCompanyAction} className="flex items-center gap-2">
                <input type="hidden" name="userId" value={c.user_id} />
                <input type="hidden" name="email" value={c.email} />
                <input
                  name="reason"
                  placeholder="Reason for rejecting (required)"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-line text-xs outline-none"
                />
                <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-apricot/15 text-apricot-deep whitespace-nowrap">
                  Reject
                </button>
              </form>
            </div>
          ))}
          {pendingCompanies.length === 0 && <p className="text-sm text-muted">Nothing waiting on review.</p>}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-medium text-sm text-muted uppercase tracking-wide">
          Rejected companies ({rejectedCompanies.length})
        </h2>
        <div className="flex flex-col gap-2 mt-3">
          {rejectedCompanies.map((c: any) => (
            <div key={c.user_id} className="p-4 rounded-xl border border-line bg-white flex items-start justify-between gap-4">
              <div>
                <Link href={`/admin/users/${c.user_id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
                <p className="text-sm text-muted mt-1">{c.email}</p>
                <p className="text-xs text-muted mt-1">
                  Rejected {c.reviewed_at?.slice(0, 10)} by {c.reviewed_by} — {c.rejection_reason}
                </p>
              </div>
              <form action={reconsiderCompanyAction}>
                <input type="hidden" name="userId" value={c.user_id} />
                <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-white border border-line whitespace-nowrap">
                  Reconsider
                </button>
              </form>
            </div>
          ))}
          {rejectedCompanies.length === 0 && <p className="text-sm text-muted">No rejected companies.</p>}
        </div>
      </div>
    </div>
  );
}
