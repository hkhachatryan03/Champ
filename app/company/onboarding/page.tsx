import { getSession } from "@/lib/auth";
import { updateCompanyProfile } from "@/lib/queries";
import { redirect } from "next/navigation";

async function saveCompanyAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const about = String(formData.get("about") || "").trim();

  if (!name || !website || !about) {
    redirect("/company/onboarding?error=1");
  }

  await updateCompanyProfile(session.userId, {
    name,
    industry: String(formData.get("industry") || ""),
    size: String(formData.get("size") || ""),
    website,
    about,
    onboarded: 1,
  });

  redirect("/company/dashboard");
}

export default async function CompanyOnboarding({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const { error } = await searchParams;

  return (
    <div className="px-6 py-10 max-w-lg mx-auto">
      <h1 className="font-display font-semibold text-2xl">Company profile</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Website/LinkedIn and a short &quot;about us&quot; are required — candidates
        need at least that much to know who they&apos;d be talking to. Doesn&apos;t
        need to be long.
      </p>
      {error && (
        <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Please fill in company name, website/LinkedIn, and a short about-us.
        </div>
      )}
      <form action={saveCompanyAction} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted">Company name</label>
          <input name="name" required placeholder="Lusar Labs" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Industry</label>
          <input name="industry" placeholder="Fintech" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Company size</label>
          <input name="size" placeholder="11–50 employees" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Website or LinkedIn (required)</label>
          <input name="website" required placeholder="lusarlabs.am" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Short &quot;about us&quot; (required)</label>
          <textarea name="about" required rows={3} placeholder="One or two sentences on what you do." className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <button type="submit" className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
          Continue to dashboard
        </button>
      </form>
    </div>
  );
}
