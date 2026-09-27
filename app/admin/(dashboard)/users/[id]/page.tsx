import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getUserDetail,
  flagAccount,
  setCompanyVerified,
  resolveAccountFlag,
  deleteUserAsAdmin,
} from "@/lib/adminQueries";
import { getAdminSession } from "@/lib/adminAuth";
import { parseSkills } from "@/lib/queries";

async function flagAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const userId = Number(formData.get("userId"));
  const reason = String(formData.get("reason") || "").trim();
  const sendMessage = formData.get("sendMessage") === "1";
  const userMessage = String(formData.get("userMessage") || "").trim();
  if (!reason) redirect(`/admin/users/${userId}`);
  await flagAccount(userId, reason, session!.email, {
    visibleToUser: sendMessage && !!userMessage,
    userMessage: sendMessage ? userMessage : "",
  });
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

async function deleteUserAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const userId = Number(formData.get("userId"));
  const confirmEmail = String(formData.get("confirmEmail") || "").trim().toLowerCase();
  const actualEmail = String(formData.get("actualEmail") || "").trim().toLowerCase();
  const reason = String(formData.get("reason") || "").trim() || "No reason given";

  // Require typing the exact email back — a deliberate speed bump since
  // this is the one irreversible action in the whole BackOffice.
  if (confirmEmail !== actualEmail) {
    redirect(`/admin/users/${userId}?deleteError=1`);
  }
  await deleteUserAsAdmin(userId, session!.email, reason);
  redirect("/admin/users");
}

function fmtMoney(min: number, max: number) {
  if (!min && !max) return null;
  return `$${min}–$${max}/mo`;
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { id } = await params;
  const { deleteError } = await searchParams;
  const detail = await getUserDetail(Number(id));
  if (!detail) notFound();

  const { user, profile, flags, statCount, experiences, education, responseRate } = detail;
  const openFlags = flags.filter((f: any) => !f.resolved);
  const pastFlags = flags.filter((f: any) => f.resolved);
  const isCandidate = user.role === "candidate";

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

      {/* --- Stats --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-xl border border-line bg-white">
          <p className="text-xs text-muted">{isCandidate ? "Applications sent" : "Jobs posted"}</p>
          <p className="font-display font-semibold text-2xl mt-1">{statCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-line bg-white">
          <p className="text-xs text-muted">Last active</p>
          <p className="font-display font-semibold text-2xl mt-1">{user.last_seen_at?.slice(0, 10) || "—"}</p>
        </div>
        {!isCandidate && responseRate && (
          <div className="p-4 rounded-xl border border-line bg-white">
            <p className="text-xs text-muted">Response rate</p>
            <p className="font-display font-semibold text-2xl mt-1">{responseRate.rate}%</p>
            <p className="text-xs text-muted mt-0.5">
              {responseRate.responded} of {responseRate.total} applications replied to
            </p>
          </div>
        )}
      </div>

      {/* --- Profile details --- */}
      <div className="mt-8">
        <h2 className="font-medium text-sm text-muted uppercase tracking-wide">Profile</h2>
        <div className="p-5 rounded-xl border border-line bg-white mt-3 flex flex-col gap-3 text-sm">
          {!profile?.onboarded && (
            <p className="text-xs bg-paper-dim px-3 py-2 rounded-lg text-muted w-fit">
              Onboarding not completed — some fields below may be empty.
            </p>
          )}

          {isCandidate ? (
            <>
              {profile?.title && <p><span className="text-muted">Title:</span> {profile.title}</p>}
              {profile?.location && <p><span className="text-muted">Location:</span> {profile.location}</p>}
              <p><span className="text-muted">Years of experience:</span> {profile?.years_experience ?? 0}</p>
              {fmtMoney(profile?.salary_min, profile?.salary_max) && (
                <p><span className="text-muted">Expected salary:</span> {fmtMoney(profile.salary_min, profile.salary_max)}</p>
              )}
              <p><span className="text-muted">Open to remote:</span> {profile?.remote_ok ? "Yes" : "No"}</p>
              <p><span className="text-muted">Actively looking:</span> {profile?.actively_looking ? "Yes" : "No"}</p>
              {profile?.linkedin_url && (
                <p>
                  <span className="text-muted">LinkedIn:</span>{" "}
                  <a href={profile.linkedin_url} target="_blank" className="underline">{profile.linkedin_url}</a>
                </p>
              )}
              {profile?.cv_filename && <p><span className="text-muted">CV on file:</span> {profile.cv_filename}</p>}
              {parseSkills(profile?.skills).length > 0 && (
                <p><span className="text-muted">Skills:</span> {parseSkills(profile.skills).join(", ")}</p>
              )}
              {parseSkills(profile?.preferred_positions).length > 0 && (
                <p><span className="text-muted">Preferred positions:</span> {parseSkills(profile.preferred_positions).join(", ")}</p>
              )}
              {parseSkills(profile?.languages).length > 0 && (
                <p><span className="text-muted">Languages:</span> {parseSkills(profile.languages).join(", ")}</p>
              )}
              {profile?.about && (
                <div>
                  <p className="text-muted">About:</p>
                  <p className="mt-1 whitespace-pre-wrap">{profile.about}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {profile?.industry && <p><span className="text-muted">Industry:</span> {profile.industry}</p>}
              {profile?.size && <p><span className="text-muted">Company size:</span> {profile.size}</p>}
              {profile?.website && (
                <p>
                  <span className="text-muted">Website:</span>{" "}
                  <a href={profile.website} target="_blank" className="underline">{profile.website}</a>
                </p>
              )}
              {profile?.address && <p><span className="text-muted">Address:</span> {profile.address}</p>}
              {profile?.phone && <p><span className="text-muted">Phone:</span> {profile.phone}</p>}
              {profile?.recruiter_name && <p><span className="text-muted">Recruiter contact:</span> {profile.recruiter_name}</p>}
              {profile?.about && (
                <div>
                  <p className="text-muted">About:</p>
                  <p className="mt-1 whitespace-pre-wrap">{profile.about}</p>
                </div>
              )}
            </>
          )}
        </div>

        {isCandidate && experiences.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Work experience</p>
            <div className="flex flex-col gap-2 mt-2">
              {experiences.map((e: any) => (
                <div key={e.id} className="p-3 rounded-lg border border-line bg-white text-sm">
                  <p className="font-medium">{e.title} · {e.company}</p>
                  <p className="text-xs text-muted mt-0.5">{e.start_year}–{e.end_year || "present"}</p>
                  {e.description && <p className="text-xs mt-1 whitespace-pre-wrap">{e.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {isCandidate && education.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Education</p>
            <div className="flex flex-col gap-2 mt-2">
              {education.map((e: any) => (
                <div key={e.id} className="p-3 rounded-lg border border-line bg-white text-sm">
                  <p className="font-medium">{e.degree || e.field || "—"} · {e.institution}</p>
                  <p className="text-xs text-muted mt-0.5">{e.start_year}–{e.end_year || "present"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- Flags --- */}
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
                {f.visible_to_user && f.user_message && (
                  <div className="mt-2 p-2 rounded-lg bg-white border border-apricot/30">
                    <p className="text-xs text-muted">Message sent to {isCandidate ? "candidate" : "company"}:</p>
                    <p className="text-sm mt-0.5">{f.user_message}</p>
                  </div>
                )}
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

        <form action={flagAction} className="flex flex-col gap-2 mt-4 max-w-md">
          <input type="hidden" name="userId" value={user.id} />
          <input
            name="reason"
            placeholder="Internal note — why you're flagging this account (private)"
            className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white"
          />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="sendMessage" value="1" />
            Also send a message to this account (they&apos;ll see it on their profile)
          </label>
          <textarea
            name="userMessage"
            placeholder="Message shown to them, e.g. &quot;Please make sure every listing includes a real salary range.&quot;"
            rows={2}
            className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white"
          />
          <button type="submit" className="self-start px-4 py-2 rounded-lg bg-ink text-paper text-sm font-medium">
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

      {/* --- Danger zone --- */}
      <div className="mt-10">
        <h2 className="font-medium text-sm text-apricot-deep uppercase tracking-wide">Danger zone</h2>
        <div className="p-5 rounded-xl border border-apricot/30 bg-apricot/5 mt-3">
          <p className="text-sm">
            Permanently delete this account. This also removes their{" "}
            {isCandidate ? "applications and messages" : "job listings, applications received, and messages"} —
            there is no undo.
          </p>
          {deleteError === "1" && (
            <p className="text-sm text-apricot-deep mt-2 font-medium">
              That didn&apos;t match their email exactly — nothing was deleted. Try again.
            </p>
          )}
          <details className="mt-3">
            <summary className="text-sm underline cursor-pointer w-fit">Delete this account</summary>
            <form action={deleteUserAction} className="flex flex-col gap-2 mt-3 max-w-md">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="actualEmail" value={user.email} />
              <input
                name="reason"
                placeholder="Reason (kept in the audit log)"
                className="px-3 py-2 rounded-lg border border-line text-sm outline-none"
              />
              <label className="text-xs text-muted">
                Type <span className="font-mono">{user.email}</span> to confirm:
              </label>
              <input
                name="confirmEmail"
                placeholder={user.email}
                className="px-3 py-2 rounded-lg border border-line text-sm outline-none"
              />
              <button type="submit" className="self-start px-4 py-2 rounded-lg bg-apricot-deep text-white text-sm font-medium">
                Permanently delete
              </button>
            </form>
          </details>
        </div>
      </div>
    </div>
  );
}
