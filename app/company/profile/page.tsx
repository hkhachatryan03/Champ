import { getSession } from "@/lib/auth";
import { getCompanyProfile, updateCompanyProfile, listSocialLinks, addSocialLink, deleteSocialLink, SOCIAL_PLATFORMS } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import CroppablePhotoInput from "@/components/CroppablePhotoInput";
import UnsavedChangesGuard from "@/components/UnsavedChangesGuard";
import RichEditor from "@/components/RichEditor";
import { sanitizeRichText } from "@/lib/sanitize";
import FormattedMessage from "@/components/FormattedMessage";
import AdminNoticeBanner from "@/components/AdminNoticeBanner";
import GuestPage from "@/components/GuestPage";
import { ArrowRight, Building2, Link2, MapPin, Phone, Plus, Trash2 } from "lucide-react";
import {
  listPendingTeamMembers,
  approveTeamMember,
  declineTeamMember,
} from "@/lib/companyMembership";

async function saveAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const name = String(formData.get("name") || "").trim();
  const recruiterName = String(formData.get("recruiterName") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const about = sanitizeRichText(String(formData.get("about") || ""));
  if (!name || !recruiterName || !website || !about.replace(/<[^>]*>/g, "").trim()) redirect("/company/profile?error=1");

  await updateCompanyProfile(session.userId, {
    name,
    recruiter_name: recruiterName,
    industry: String(formData.get("industry") || ""),
    size: String(formData.get("size") || ""),
    website,
    address: String(formData.get("address") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    about,
  });
  redirect("/company/profile");
}

async function updateAvatarAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const avatarFile = formData.get("avatar") as File | null;
  if (!avatarFile || avatarFile.size === 0) return;

  try {
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    const safeName = `avatar/${session.userId}_${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const blob = await put(safeName, buffer, { access: "public", contentType: avatarFile.type || "image/jpeg" });
    await updateCompanyProfile(session.userId, { avatar_url: blob.url });
    revalidatePath("/company/profile");
  } catch (err) {
    console.error("Blob upload failed (avatar):", err);
    redirect("/company/profile?avatarError=1");
  }
}

async function addSocialLinkAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const platform = String(formData.get("platform") || "").trim();
  const url = String(formData.get("url") || "").trim();
  if (platform && url) {
    await addSocialLink(session.userId, platform, url);
  }
  revalidatePath("/company/profile");
}

async function deleteSocialLinkAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const id = Number(formData.get("id"));
  await deleteSocialLink(id, session.userId);
  revalidatePath("/company/profile");
}

async function approveTeamMemberAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await approveTeamMember(Number(formData.get("teammateId")), session.userId, session.email);
  revalidatePath("/company/profile");
}

async function declineTeamMemberAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await declineTeamMember(Number(formData.get("teammateId")), session.userId, session.email);
  revalidatePath("/company/profile");
}

export default async function CompanyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; avatarError?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId, { allowPending: true });
  const profile = await getCompanyProfile(session.userId);
  const socialLinks = await listSocialLinks(session.userId);
  const pendingTeammates = profile.member_role === "owner" ? await listPendingTeamMembers(session.userId) : [];
  const { error, avatarError } = await searchParams;

  const websiteHref = profile.website
    ? profile.website.startsWith("http") ? profile.website : `https://${profile.website}`
    : null;

  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-14 max-w-[1120px] mx-auto">
        <div className="aur-hero-in flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display font-semibold text-[clamp(34px,5vw,44px)] leading-[1.1] text-paper">My profile</h1>
          <a href={`/companies/${session.userId}`} target="_blank" rel="noopener noreferrer" className="text-[13px] underline underline-offset-[3px] text-apricot whitespace-nowrap">
            Preview as candidates see us →
          </a>
        </div>

        <AdminNoticeBanner glass userId={session.userId} />

        {profile.review_status === "pending" && (
          <div className="mt-4 px-[18px] py-[13px] rounded-2xl text-[13.5px] leading-[1.55] bg-paper/[.05] border border-paper/15 text-paper/75">
            Your company is under review by Champ — you can keep editing your profile, but job posting and messaging are locked until it&apos;s approved.
          </div>
        )}
        {profile.review_status === "pending_team" && (
          <div className="mt-4 px-[18px] py-[13px] rounded-2xl text-[13.5px] leading-[1.55] bg-paper/[.05] border border-paper/15 text-paper/75">
            Waiting for your team to approve you before you can post jobs or message candidates.
          </div>
        )}
        {profile.review_status === "rejected" && (
          <div className="mt-4 px-[18px] py-[13px] rounded-2xl text-[13.5px] leading-[1.55] bg-apricot/10 border border-apricot/35 text-[#F6D3A6]">
            This company wasn&apos;t approved{profile.rejection_reason ? `: ${profile.rejection_reason}` : "."}
          </div>
        )}

        {profile.member_role === "owner" && pendingTeammates.length > 0 && (
          <div className="aur-bezel mt-4">
            <div className="aur-bezel-inner px-6 py-5">
              <h2 className="text-[14.5px] font-semibold text-paper">Teammates waiting on your approval</h2>
              <div className="mt-2">
                {pendingTeammates.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between gap-3.5 py-3 border-t border-paper/10 first:border-t-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-paper">{m.recruiter_name || m.email}</div>
                      <div className="text-xs text-paper/50">{m.email}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <form action={approveTeamMemberAction}>
                        <input type="hidden" name="teammateId" value={m.user_id} />
                        <button type="submit" className="px-3.5 py-[7px] rounded-full text-xs font-medium whitespace-nowrap border border-[rgba(127,176,138,.5)] bg-[rgba(127,176,138,.18)] text-[#A9D8B2] hover:border-apricot hover:text-apricot transition-colors">
                          Approve
                        </button>
                      </form>
                      <form action={declineTeamMemberAction}>
                        <input type="hidden" name="teammateId" value={m.user_id} />
                        <button type="submit" className="px-3.5 py-[7px] rounded-full text-xs font-medium whitespace-nowrap border border-paper/15 text-paper hover:border-apricot hover:text-apricot transition-colors">
                          Decline
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="aur-alert mt-4 !text-sm !px-4 !py-3 !rounded-2xl">
            Please fill in company name, website/LinkedIn, and about-us — these are required.
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[330px_minmax(0,1fr)] gap-7 mt-6 items-start">
          {/* ---------- Left rail: who we are at a glance ---------- */}
          <aside className="lg:sticky lg:top-[96px] flex flex-col gap-3.5">
            <div className="aur-bezel">
              <div className="aur-bezel-inner p-6">
                <div className="flex items-center gap-4">
                  <form id="avatarForm" action={updateAvatarAction} encType="multipart/form-data" className="flex-shrink-0">
                    <CroppablePhotoInput glass name="avatar" existingPhotoUrl={profile.avatar_url} formIdToSubmit="avatarForm" fallbackInitial={(profile.name || "?").charAt(0).toUpperCase()} />
                  </form>
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-[21px] leading-[1.2] text-paper">{profile.name || "(unnamed company)"}</div>
                    {profile.recruiter_name && <div className="text-[13px] text-paper/58 mt-1">Recruiter: {profile.recruiter_name}</div>}
                  </div>
                </div>
                {avatarError === "1" && (
                  <div className="aur-alert mt-3.5 !text-[12.5px]">
                    Your logo failed to upload — try a different file or try again in a moment.
                  </div>
                )}
                {(profile.industry || profile.size) && (
                  <p className="flex items-center gap-2 text-[13px] text-paper/62 mt-[18px]">
                    <Building2 size={15} strokeWidth={1.4} className="text-apricot flex-shrink-0" />
                    {profile.industry} {profile.industry && profile.size && "·"} {profile.size}
                  </p>
                )}
                {websiteHref && (
                  <p className="flex items-center gap-2 text-[13px] mt-2.5 break-all">
                    <Link2 size={15} strokeWidth={1.4} className="text-apricot flex-shrink-0" />
                    <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-[3px] text-apricot">{profile.website}</a>
                  </p>
                )}
                {profile.address && (
                  <p className="flex items-center gap-2 text-[13px] text-paper/62 mt-2.5"><MapPin size={15} strokeWidth={1.4} className="text-apricot flex-shrink-0" /> {profile.address}</p>
                )}
                {profile.phone && (
                  <p className="flex items-center gap-2 text-[13px] text-paper/62 mt-2.5"><Phone size={15} strokeWidth={1.4} className="text-apricot flex-shrink-0" /> {profile.phone}</p>
                )}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {socialLinks.map((sl) => (
                      <a
                        key={sl.id}
                        href={sl.url.startsWith("http") ? sl.url : `https://${sl.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aur-tag no-underline hover:border-apricot hover:text-apricot transition-colors"
                      >
                        {sl.platform}
                      </a>
                    ))}
                  </div>
                )}

                {!profile.verified && (
                  <div className="mt-4 px-4 py-3.5 rounded-2xl bg-paper/[.045] border border-paper/10">
                    <p className="text-[13.5px] font-semibold text-paper">Not yet verified</p>
                    <p className="text-xs leading-[1.6] text-paper/55 mt-[5px] mb-2">
                      In these early days, our team verifies real companies by hand rather
                      than automatically. To get verified: send us (via Contact Us below)
                      your company&apos;s registration name/number and a work email at your
                      company&apos;s own domain (not a personal Gmail). We&apos;ll confirm and
                      flip your badge on — usually within a day.
                    </p>
                    <a href="/contact" className="text-[12.5px] underline underline-offset-[3px] text-apricot">
                      Go to Contact Us →
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="aur-bezel-sm hidden lg:block">
              <div className="aur-bezel-inner p-2 flex flex-col gap-0.5">
                {[
                  ["#about", "About us", null],
                  ["#social", "Social links", socialLinks.length],
                  ["#edit", "Edit profile", null],
                ].map(([href, label, count]) => (
                  <a key={href as string} href={href as string} className="flex items-center justify-between px-3.5 py-2.5 rounded-[14px] text-[13.5px] text-paper/72 hover:bg-paper/[.06] hover:text-paper transition-colors">
                    {label}
                    <em className="not-italic font-mono-num text-xs text-paper/40">{count === null ? "→" : count}</em>
                  </a>
                ))}
              </div>
            </div>
          </aside>

          {/* ---------- Main column ---------- */}
          <div className="flex flex-col gap-10 min-w-0">
            {profile.about && (
              <section id="about" className="scroll-mt-24">
                <h2 className="font-display font-semibold text-2xl mb-4 text-paper">About us</h2>
                <div className="aur-bezel">
                  <div className="aur-bezel-inner px-7 py-[26px] text-[15px] leading-[1.75] text-paper/75 [&_strong]:text-paper [&_b]:text-paper [&_li::marker]:text-apricot">
                    <FormattedMessage body={profile.about} />
                  </div>
                </div>
              </section>
            )}

            <section id="social" className="scroll-mt-24">
              <h2 className="font-display font-semibold text-2xl mb-4 flex items-baseline gap-3 text-paper">Social links <small className="font-mono-num text-xs text-paper/40 font-medium">{socialLinks.length}</small></h2>
              <div className="flex flex-col gap-2.5">
                {socialLinks.map((sl) => (
                  <div key={sl.id} className="aur-entry">
                    <div className="flex items-start justify-between gap-3.5">
                      <div className="min-w-0">
                        <div className="text-[15px] font-medium text-paper">{sl.platform}</div>
                        <div className="text-xs text-paper/50 font-mono-num mt-0.5 break-all">{sl.url}</div>
                      </div>
                      <form action={deleteSocialLinkAction}>
                        <input type="hidden" name="id" value={sl.id} />
                        <button type="submit" className="aur-entry-btn"><Trash2 size={13} strokeWidth={1.5} /> Remove</button>
                      </form>
                    </div>
                  </div>
                ))}
                {socialLinks.length === 0 && <p className="text-sm text-paper/50 px-0.5">No social links added yet.</p>}
              </div>
              <details className="aur-add">
                <summary><Plus size={15} strokeWidth={1.6} /> Add a link</summary>
                <form action={addSocialLinkAction} className="aur-addform">
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <select name="platform" required className="aur-field">
                      <option value="">Choose platform</option>
                      {SOCIAL_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                    <input name="url" required placeholder="Link" className="aur-field" />
                  </div>
                  <button type="submit" className="aur-btn-sm self-start"><Plus size={14} strokeWidth={1.8} /> Add link</button>
                </form>
              </details>
            </section>

            <section id="edit" className="scroll-mt-24">
              <h2 className="font-display font-semibold text-2xl mb-4 text-paper">Edit profile</h2>
              <form id="companyProfileForm" action={saveAction} encType="multipart/form-data" className="flex flex-col gap-4">
                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner aur-fs">
                    <h3>The basics</h3>
                    <div>
                      <label className="aur-label">Your name (the recruiter)</label>
                      <input name="recruiterName" defaultValue={profile.recruiter_name} required className="aur-field" />
                    </div>
                    <div>
                      <label className="aur-label">Company name</label>
                      <input name="name" defaultValue={profile.name} required className="aur-field" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="aur-label">Industry</label>
                        <input name="industry" defaultValue={profile.industry} className="aur-field" />
                      </div>
                      <div>
                        <label className="aur-label">Company size</label>
                        <input name="size" defaultValue={profile.size} className="aur-field" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner aur-fs">
                    <h3>Contact</h3>
                    <div>
                      <label className="aur-label">Website or LinkedIn (required)</label>
                      <input name="website" defaultValue={profile.website} required className="aur-field" />
                    </div>
                    <div>
                      <label className="aur-label">Address (optional)</label>
                      <input name="address" defaultValue={profile.address} placeholder="e.g. 12 Northern Ave, Yerevan" className="aur-field" />
                    </div>
                    <div>
                      <label className="aur-label">Phone (optional)</label>
                      <input name="phone" defaultValue={profile.phone} placeholder="+374 XX XXX XXX" className="aur-field" />
                    </div>
                  </div>
                </div>

                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner aur-fs">
                    <h3>About us (required)</h3>
                    <RichEditor glass name="about" defaultValue={profile.about} required minHeight={110} />
                  </div>
                </div>

                <div className="aur-savebar">
                  <span className="aur-savehint">
                    <span className="aur-sh-clean">All changes saved</span>
                    <span className="aur-sh-dirty">You have unsaved changes</span>
                  </span>
                  <div className="flex items-center gap-1.5 max-md:w-full max-md:justify-between">
                    <a href="/company/profile" className="px-4 py-2.5 text-[13.5px] text-paper/65 hover:text-paper underline underline-offset-[3px] transition-colors">Cancel</a>
                    <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine !py-3 !pl-[22px] !pr-2">
                      Save changes
                      <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                    </button>
                  </div>
                </div>
              </form>
              <UnsavedChangesGuard glass formId="companyProfileForm" />
            </section>
          </div>
        </div>
      </div>
    </GuestPage>
  );
}
