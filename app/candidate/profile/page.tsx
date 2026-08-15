import { getSession } from "@/lib/auth";
import { getCandidateProfile, updateCandidateProfile, parseSkills, listExperiences, addExperience, deleteExperience } from "@/lib/queries";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Ledger, Tag } from "@/components/ui";
import { put } from "@vercel/blob";
import { extractTextFromPdf, guessName, guessNameFromLinkedinUrl } from "@/lib/cvParsing";

async function toggleActiveAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const next = String(formData.get("next"));
  await updateCandidateProfile(session.userId, { actively_looking: next === "1" ? 1 : 0 });
  revalidatePath("/candidate/profile");
}

async function addExperienceAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const company = String(formData.get("company") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const startYear = Number(formData.get("startYear") || 0);
  const endYearRaw = String(formData.get("endYear") || "").trim();
  const endYear = endYearRaw ? Number(endYearRaw) : null;
  if (company && title && startYear) {
    const result = await addExperience(session.userId, company, title, startYear, endYear);
    if (!result.ok) {
      redirect(`/candidate/profile?expError=${encodeURIComponent(result.error!)}`);
    }
  }
  revalidatePath("/candidate/profile");
}

async function deleteExperienceAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const id = Number(formData.get("id"));
  await deleteExperience(id, session.userId);
  revalidatePath("/candidate/profile");
}

async function saveProfileAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");

  const name = String(formData.get("name") || "");
  const title = String(formData.get("title") || "");
  const years = Number(formData.get("years") || 0);
  const skills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const salaryMin = Number(formData.get("salaryMin") || 0);
  const salaryMax = Number(formData.get("salaryMax") || 0);
  const remoteOk = formData.get("remoteOk") ? 1 : 0;
  const about = String(formData.get("about") || "");
  const linkedinUrl = String(formData.get("linkedinUrl") || "").trim();

  let cvUpdate: { cv_filename?: string; name?: string } = {};
  const cvFile = formData.get("cv") as File | null;
  if (cvFile && cvFile.size > 0) {
    const buffer = Buffer.from(await cvFile.arrayBuffer());
    const safeName = `cv/${session.userId}_${Date.now()}_${cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const blob = await put(safeName, buffer, { access: "public", contentType: "application/pdf" });
    cvUpdate.cv_filename = blob.url;
    // Only overwrite the name if the person left the name field blank —
    // otherwise their manual edit here takes priority over a fresh guess.
    if (!name) {
      const text = await extractTextFromPdf(buffer);
      const guessed = guessName(text, cvFile.name);
      if (guessed) cvUpdate.name = guessed;
    }
  }
  if (!name && !cvUpdate.name && linkedinUrl) {
    const guessed = guessNameFromLinkedinUrl(linkedinUrl);
    if (guessed) cvUpdate.name = guessed;
  }

  await updateCandidateProfile(session.userId, {
    ...(name ? { name } : {}),
    title,
    years_experience: years,
    skills: JSON.stringify(skills),
    salary_min: salaryMin,
    salary_max: salaryMax,
    remote_ok: remoteOk,
    about,
    linkedin_url: linkedinUrl,
    ...cvUpdate,
  });
  redirect("/candidate/profile");
}

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ expError?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const profile = await getCandidateProfile(session.userId);
  const skills = parseSkills(profile.skills);
  const experiences = await listExperiences(session.userId);
  const { expError } = await searchParams;

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="font-display font-semibold text-2xl">My profile</h1>

      <div className="mt-5 p-4 rounded-xl border border-line bg-white flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Actively looking for a job</p>
          <p className="text-xs text-muted mt-0.5">
            {profile.actively_looking
              ? "Companies can find you when they search the candidate pool."
              : "You're hidden from search, but can still apply to roles directly."}
          </p>
        </div>
        <form action={toggleActiveAction}>
          <input type="hidden" name="next" value={profile.actively_looking ? "0" : "1"} />
          <button
            type="submit"
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              profile.actively_looking ? "bg-moss/15 text-moss" : "bg-ink/8 text-muted"
            }`}
          >
            {profile.actively_looking ? "Active" : "Not active"}
          </button>
        </form>
      </div>

      <div className="mt-5 p-5 rounded-xl border border-line bg-white">
        <div className="font-display font-semibold text-lg">{profile.name || "(no name yet)"}</div>
        <div className="text-sm text-muted">{profile.title} · {profile.years_experience} yrs experience</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s) => <Tag key={s}>{s}</Tag>)}
          {!!profile.remote_ok && <Tag tone="moss">Remote OK</Tag>}
        </div>
        <div className="mt-3"><Ledger min={profile.salary_min} max={profile.salary_max} /></div>
        {profile.cv_filename && (
          <p className="text-sm text-muted mt-3">
            <a href={profile.cv_filename} target="_blank" rel="noopener noreferrer" className="underline">View CV on file</a>
          </p>
        )}
        {profile.linkedin_url && (
          <p className="text-sm text-muted mt-1">LinkedIn: {profile.linkedin_url}</p>
        )}
      </div>

      <h2 className="font-display font-semibold text-lg mt-8 mb-3">Work experience</h2>
      <div className="flex flex-col gap-2 mb-4">
        {experiences.map((e) => (
          <div key={e.id} className="p-3 rounded-lg border border-line bg-white flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{e.title} · {e.company}</div>
              <div className="text-xs text-muted">{e.start_year} – {e.end_year || "Present"}</div>
            </div>
            <form action={deleteExperienceAction}>
              <input type="hidden" name="id" value={e.id} />
              <button type="submit" className="text-xs text-muted underline">Remove</button>
            </form>
          </div>
        ))}
        {experiences.length === 0 && <p className="text-sm text-muted">No work experience added yet.</p>}
      </div>
      {expError && (
        <div className="mb-3 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          {expError}
        </div>
      )}
      <form action={addExperienceAction} className="p-4 rounded-lg bg-paper-dim flex flex-col gap-3 mb-8">
        <p className="text-xs font-medium text-muted">Add a role</p>
        <div className="flex gap-2">
          <input name="title" placeholder="Title (e.g. Frontend Engineer)" required className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
          <input name="company" placeholder="Company" required className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div className="flex gap-2 items-center">
          <input name="startYear" type="number" placeholder="Start year" required className="w-28 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
          <span className="text-sm text-muted">to</span>
          <input name="endYear" type="number" placeholder="End year (blank = present)" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper w-fit">
          + Add
        </button>
      </form>

      <h2 className="font-display font-semibold text-lg mb-3">Edit profile</h2>
      <form action={saveProfileAction} encType="multipart/form-data" className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted">Full name</label>
          <input name="name" defaultValue={profile.name} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Current title</label>
          <input name="title" defaultValue={profile.title} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Years of experience</label>
          <input name="years" type="number" defaultValue={profile.years_experience} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Skills (comma separated)</label>
          <input name="skills" defaultValue={skills.join(", ")} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted">Salary min ($/mo)</label>
            <input name="salaryMin" type="number" defaultValue={profile.salary_min} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted">Salary max ($/mo)</label>
            <input name="salaryMax" type="number" defaultValue={profile.salary_max} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remoteOk" defaultChecked={!!profile.remote_ok} /> Open to remote roles
        </label>
        <div>
          <label className="text-xs font-medium text-muted">About you</label>
          <textarea name="about" defaultValue={profile.about} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">LinkedIn URL</label>
          <input name="linkedinUrl" defaultValue={profile.linkedin_url} placeholder="linkedin.com/in/yourname" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Replace CV (PDF)</label>
          <input name="cv" type="file" accept="application/pdf" className="file-input w-full mt-1 text-sm" />
        </div>
        <button type="submit" className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-ink text-paper w-fit">
          Save changes
        </button>
      </form>
    </div>
  );
}
