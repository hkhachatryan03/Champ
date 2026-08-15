import { getSession } from "@/lib/auth";
import { getCompanyProfile, updateCompanyProfile } from "@/lib/queries";
import { redirect } from "next/navigation";

async function saveAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const name = String(formData.get("name") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const about = String(formData.get("about") || "").trim();
  if (!name || !website || !about) redirect("/company/profile?error=1");
  await updateCompanyProfile(session.userId, {
    name,
    industry: String(formData.get("industry") || ""),
    size: String(formData.get("size") || ""),
    website,
    about,
  });
  redirect("/company/profile");
}

export default async function CompanyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const profile = await getCompanyProfile(session.userId);
  const { error } = await searchParams;

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="font-display font-semibold text-2xl">My profile</h1>

      <div className="mt-5 p-5 rounded-xl border border-line bg-white mb-8">
        <div className="font-display font-semibold text-lg">{profile.name || "(unnamed company)"}</div>
        <div className="text-sm text-muted mt-1">
          {profile.industry} {profile.industry && "·"} {profile.size} {profile.website && "· " + profile.website}
        </div>
        {profile.about && <p className="text-sm mt-3">{profile.about}</p>}

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

      {error && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Please fill in company name, website/LinkedIn, and about-us — these are required.
        </div>
      )}

      <form action={saveAction} className="flex flex-col gap-4">
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
          <label className="text-xs font-medium text-muted">About us (required)</label>
          <textarea name="about" defaultValue={profile.about} required rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <button type="submit" className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-ink text-paper w-fit">
          Save changes
        </button>
      </form>
    </div>
  );
}
