import { getSession } from "@/lib/auth";
import { getCompanyProfile, updateCompanyProfile, listSocialLinks, addSocialLink, deleteSocialLink, SOCIAL_PLATFORMS } from "@/lib/queries";
import { requireOnboardedCompany } from "@/lib/guards";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import CroppablePhotoInput from "@/components/CroppablePhotoInput";
import RichTextarea from "@/components/RichTextarea";
import FormattedMessage from "@/components/FormattedMessage";

async function saveAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const name = String(formData.get("name") || "").trim();
  const recruiterName = String(formData.get("recruiterName") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const about = String(formData.get("about") || "").trim();
  if (!name || !recruiterName || !website || !about) redirect("/company/profile?error=1");

  let avatarUpdate: { avatar_url?: string } = {};
  const avatarFile = formData.get("avatar") as File | null;
  let avatarFailed = false;
  if (avatarFile && avatarFile.size > 0) {
    try {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const safeName = `avatar/${session.userId}_${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const blob = await put(safeName, buffer, { access: "public", contentType: avatarFile.type || "image/jpeg" });
      avatarUpdate.avatar_url = blob.url;
    } catch (err) {
      console.error("Blob upload failed (avatar):", err);
      avatarFailed = true;
    }
  }

  await updateCompanyProfile(session.userId, {
    name,
    recruiter_name: recruiterName,
    industry: String(formData.get("industry") || ""),
    size: String(formData.get("size") || ""),
    website,
    address: String(formData.get("address") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    about,
    ...avatarUpdate,
  });
  redirect(avatarFailed ? "/company/profile?avatarError=1" : "/company/profile");
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

export default async function CompanyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; avatarError?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  await requireOnboardedCompany(session.userId);
  const profile = await getCompanyProfile(session.userId);
  const socialLinks = await listSocialLinks(session.userId);
  const { error, avatarError } = await searchParams;

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl">My profile</h1>
        <a href={`/companies/${session.userId}`} target="_blank" rel="noopener noreferrer" className="text-xs underline text-apricot-deep whitespace-nowrap">
          Preview as candidates see us →
        </a>
      </div>

      <div className="mt-5 p-5 rounded-xl border border-line bg-white mb-8">
        <div className="flex items-center gap-3">
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
          )}
          <div className="font-display font-semibold text-lg">{profile.name || "(unnamed company)"}</div>
        </div>
        {profile.recruiter_name && <div className="text-sm text-muted mt-2">Recruiter: {profile.recruiter_name}</div>}
        <div className="text-sm text-muted mt-1">
          {profile.industry} {profile.industry && "·"} {profile.size} {profile.website && "· " + profile.website}
        </div>
        {profile.address && <p className="text-sm text-muted mt-1">📍 {profile.address}</p>}
        {profile.phone && <p className="text-sm text-muted mt-0.5">📞 {profile.phone}</p>}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {socialLinks.map((s) => (
              <a
                key={s.id}
                href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline text-apricot-deep"
              >
                {s.platform}
              </a>
            ))}
          </div>
        )}
        {profile.about && <div className="text-sm mt-3"><FormattedMessage body={profile.about} /></div>}

        {!profile.verified && (
          <div className="mt-4 p-3 rounded-lg bg-paper-dim">
            <p className="text-sm font-medium">Not yet verified</p>
            <p className="text-xs text-muted mt-1">
              In these early days, our team verifies real companies by hand rather
              than automatically. To get verified: send us (via Contact Us below)
              your company&apos;s registration name/number and a work email at your
              company&apos;s own domain (not a personal Gmail). We&apos;ll confirm and
              flip your badge on — usually within a day.
            </p>
            <a href="/contact" className="text-xs underline mt-2 inline-block text-apricot-deep">
              Go to Contact Us →
            </a>
          </div>
        )}
      </div>

      <h2 className="font-display font-semibold text-lg mb-3">Social links</h2>
      <div className="flex flex-col gap-2 mb-4">
        {socialLinks.map((s) => (
          <div key={s.id} className="p-3 rounded-lg border border-line bg-white flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{s.platform}</span>
              <span className="text-xs text-muted ml-2">{s.url}</span>
            </div>
            <form action={deleteSocialLinkAction}>
              <input type="hidden" name="id" value={s.id} />
              <button type="submit" className="text-xs text-muted underline">Remove</button>
            </form>
          </div>
        ))}
        {socialLinks.length === 0 && <p className="text-sm text-muted">No social links added yet.</p>}
      </div>
      <form action={addSocialLinkAction} className="p-4 rounded-lg bg-paper-dim flex flex-col gap-3 mb-8">
        <div className="flex gap-2">
          <select name="platform" required className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none">
            <option value="">Choose platform</option>
            {SOCIAL_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <input name="url" required placeholder="Link" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper w-fit">
          + Add link
        </button>
      </form>

      {error && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Please fill in company name, website/LinkedIn, and about-us — these are required.
        </div>
      )}

      <form action={saveAction} encType="multipart/form-data" className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted">Your name (the recruiter)</label>
          <input name="recruiterName" defaultValue={profile.recruiter_name} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Company name</label>
          <input name="name" defaultValue={profile.name} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Industry</label>
          <input name="industry" defaultValue={profile.industry} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Company size</label>
          <input name="size" defaultValue={profile.size} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Website or LinkedIn (required)</label>
          <input name="website" defaultValue={profile.website} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Address (optional)</label>
          <input name="address" defaultValue={profile.address} placeholder="e.g. 12 Northern Ave, Yerevan" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Phone (optional)</label>
          <input name="phone" defaultValue={profile.phone} placeholder="+374 XX XXX XXX" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">About us (required)</label>
          <RichTextarea name="about" defaultValue={profile.about} required rows={3} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Company logo (optional)</label>
          <CroppablePhotoInput name="avatar" />
        </div>
        {avatarError === "1" && (
          <div className="text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
            Everything else saved, but your logo failed to upload — try a different file or try again in a moment.
          </div>
        )}
        <button type="submit" className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-ink text-paper w-fit">
          Save changes
        </button>
      </form>
    </div>
  );
}
