import { getSession } from "@/lib/auth";
import { getCandidateProfile, updateCandidateProfile, listExperiences, addExperience, deleteExperience, isEmailVerified } from "@/lib/queries";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { extractTextFromPdf, guessName, guessNameFromLinkedinUrl } from "@/lib/cvParsing";
import ClearableFileInput from "@/components/ClearableFileInput";
import TagPicker from "@/components/TagPicker";
import LanguagePicker from "@/components/LanguagePicker";
import LocationSelect from "@/components/LocationSelect";
import { COMMON_SKILLS } from "@/lib/constants";

// --- Step A actions: capture the CV or LinkedIn URL, then move to step B ---

async function uploadCvAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");

  const cvFile = formData.get("cv") as File | null;
  if (!cvFile || cvFile.size === 0) {
    redirect("/candidate/onboarding?method=cv&error=nofile");
  }

  const buffer = Buffer.from(await cvFile!.arrayBuffer());
  const safeName = `cv/${session.userId}_${Date.now()}_${cvFile!.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
  let blob;
  try {
    blob = await put(safeName, buffer, { access: "public", contentType: "application/pdf" });
  } catch (err) {
    console.error("Blob upload failed:", err);
    redirect("/candidate/onboarding?method=cv&error=uploadfailed");
  }

  const text = await extractTextFromPdf(buffer);
  const guessedName = guessName(text, cvFile!.name);

  await updateCandidateProfile(session.userId, {
    cv_filename: blob!.url,
    ...(guessedName ? { name: guessedName } : {}),
  });

  redirect("/candidate/onboarding?method=cv&step=details");
}

async function saveLinkedinAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");

  const url = String(formData.get("linkedinUrl") || "").trim();
  if (!url) redirect("/candidate/onboarding?method=linkedin&error=nourl");

  const guessedName = guessNameFromLinkedinUrl(url);
  await updateCandidateProfile(session.userId, {
    linkedin_url: url,
    ...(guessedName ? { name: guessedName } : {}),
  });
  redirect("/candidate/onboarding?method=linkedin&step=details");
}

// --- Step B action: complete/confirm whatever wasn't auto-filled ---

async function addExperienceOnboardingAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const company = String(formData.get("company") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const startYear = Number(formData.get("startYear") || 0);
  const endYearRaw = String(formData.get("endYear") || "").trim();
  const endYear = endYearRaw ? Number(endYearRaw) : null;
  const method = String(formData.get("method") || "manual");
  if (company && title && startYear) {
    const result = await addExperience(session.userId, company, title, startYear, endYear);
    if (!result.ok) {
      redirect(`/candidate/onboarding?method=${method}&step=details&expError=${encodeURIComponent(result.error!)}`);
    }
  }
  revalidatePath(`/candidate/onboarding`);
  redirect(`/candidate/onboarding?method=${method}&step=details`);
}

async function deleteExperienceOnboardingAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const id = Number(formData.get("id"));
  await deleteExperience(id, session.userId);
  const method = String(formData.get("method") || "manual");
  redirect(`/candidate/onboarding?method=${method}&step=details`);
}

async function completeProfileAction(formData: FormData) {
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
  const languages = String(formData.get("languages") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const salaryMin = Number(formData.get("salaryMin") || 0);
  const salaryMax = Number(formData.get("salaryMax") || 0);
  const method = String(formData.get("method") || "manual");
  if (salaryMax < salaryMin) {
    redirect(`/candidate/onboarding?method=${method}&step=details&error=salary`);
  }
  const remoteOk = formData.get("remoteOk") ? 1 : 0;
  const about = String(formData.get("about") || "");
  const location = String(formData.get("location") || "");
  const birthdate = String(formData.get("birthdate") || "").trim() || null;

  await updateCandidateProfile(session.userId, {
    name,
    title,
    years_experience: years,
    skills: JSON.stringify(skills),
    languages: JSON.stringify(languages),
    location,
    birthdate,
    salary_min: salaryMin,
    salary_max: salaryMax,
    remote_ok: remoteOk,
    about,
    onboarded: 1,
  });

  redirect("/candidate/jobs");
}

export default async function CandidateOnboarding({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; step?: string; error?: string; expError?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const { method, step, error, expError } = await searchParams;
  const profile = await getCandidateProfile(session.userId);
  if (!profile.onboarded && process.env.RESEND_API_KEY && !(await isEmailVerified(session.userId))) {
    redirect("/verify-email-pending");
  }

  // --- Screen 1: pick a method ---
  if (!method) {
    return (
      <div className="px-6 py-10 max-w-lg mx-auto">
        <h1 className="font-display font-semibold text-2xl">Build your profile</h1>
        <p className="text-sm text-muted mt-1 mb-6">
          This is what companies will see. Pick whichever is fastest.
        </p>
        <div className="flex flex-col gap-2">
          <a href="/candidate/onboarding?method=manual" className="px-4 py-3 rounded-lg border border-line bg-white text-sm font-medium">
            Fill it in manually
          </a>
          <a href="/candidate/onboarding?method=linkedin" className="px-4 py-3 rounded-lg border border-line bg-white text-sm font-medium">
            Import from LinkedIn
          </a>
          <a href="/candidate/onboarding?method=cv" className="px-4 py-3 rounded-lg border border-line bg-white text-sm font-medium">
            Upload my CV
          </a>
        </div>
      </div>
    );
  }

  // --- Screen 2a: CV upload (before it's attached) ---
  if (method === "cv" && !profile.cv_filename && step !== "details") {
    return (
      <div className="px-6 py-10 max-w-lg mx-auto">
        <a href="/candidate/onboarding" className="text-sm text-muted">← Change method</a>
        <h1 className="font-display font-semibold text-2xl mt-3">Upload your CV</h1>
        <p className="text-sm text-muted mt-1 mb-6">
          We&apos;ll pull your name from it automatically where we can, then
          you&apos;ll confirm and fill in anything left over on the next screen.
        </p>
        {error === "nofile" && (
          <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
            Please choose a PDF file first.
          </div>
        )}
        {error === "uploadfailed" && (
          <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
            Something went wrong uploading your CV — this usually means file storage isn't
            configured yet on this deployment. You can still finish your profile now and
            add your CV later from &quot;My profile.&quot;
          </div>
        )}
        <form action={uploadCvAction} encType="multipart/form-data" className="flex flex-col gap-4">
          <ClearableFileInput name="cv" required />
          <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
            Upload & continue
          </button>
        </form>
        <a href="/candidate/onboarding?method=cv&step=details" className="text-xs text-muted underline mt-4 inline-block">
          Skip for now, I'll add my CV later
        </a>
      </div>
    );
  }

  // --- Screen 2b: LinkedIn URL (before it's attached) ---
  if (method === "linkedin" && !profile.linkedin_url) {
    return (
      <div className="px-6 py-10 max-w-lg mx-auto">
        <a href="/candidate/onboarding" className="text-sm text-muted">← Change method</a>
        <h1 className="font-display font-semibold text-2xl mt-3">Import from LinkedIn</h1>
        <p className="text-sm text-muted mt-1 mb-6">
          We can't fetch real LinkedIn data without their official API, but
          we'll take a best guess at your name from the profile URL itself —
          you'll confirm everything else on the next screen.
        </p>
        {error === "nourl" && (
          <div className="mb-4 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
            Please paste your LinkedIn URL first.
          </div>
        )}
        <form action={saveLinkedinAction} className="flex flex-col gap-4">
          <input name="linkedinUrl" required placeholder="linkedin.com/in/yourname" className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none" />
          <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
            Continue
          </button>
        </form>
      </div>
    );
  }

  // --- Screen 3: full details, pre-filled with whatever we already know ---
  const cameFromImport = method === "cv" || method === "linkedin";
  const experiences = await listExperiences(session.userId);
  return (
    <div className="px-6 py-10 max-w-lg mx-auto">
      <a href="/candidate/onboarding" className="text-sm text-muted">← Change method</a>
      <h1 className="font-display font-semibold text-2xl mt-3">Complete your profile</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        {cameFromImport
          ? "We've filled in what we could — please check it and add anything missing."
          : "Fill in your details below."}
      </p>
      {profile.cv_filename && (
        <p className="text-xs text-moss mb-4">✓ CV on file</p>
      )}
      {profile.linkedin_url && (
        <p className="text-xs text-moss mb-4">
          ✓ LinkedIn on file:{" "}
          <a
            href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {profile.linkedin_url}
          </a>
        </p>
      )}

      <h2 className="font-display font-semibold text-lg mb-2">Work experience</h2>
      <p className="text-xs text-muted mb-3">
        Add your past roles now, or skip and add them later from &quot;My profile.&quot;
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {experiences.map((e) => (
          <div key={e.id} className="p-3 rounded-lg border border-line bg-white flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{e.title} · {e.company}</div>
              <div className="text-xs text-muted">{e.start_year} – {e.end_year || "Present"}</div>
            </div>
            <form action={deleteExperienceOnboardingAction}>
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="method" value={method} />
              <button type="submit" className="text-xs text-muted underline">Remove</button>
            </form>
          </div>
        ))}
      </div>
      {expError && (
        <div className="mb-3 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          {expError}
        </div>
      )}
      <form action={addExperienceOnboardingAction} className="p-4 rounded-lg bg-paper-dim flex flex-col gap-3 mb-8">
        <input type="hidden" name="method" value={method} />
        <div className="flex gap-2">
          <input name="title" placeholder="Title (e.g. Frontend Engineer)" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
          <input name="company" placeholder="Company" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div className="flex gap-2 items-center">
          <input name="startYear" type="number" placeholder="Start year" className="w-28 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
          <span className="text-sm text-muted">to</span>
          <input name="endYear" type="number" placeholder="End year (blank = present)" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper w-fit">
          + Add role
        </button>
      </form>

      <h2 className="font-display font-semibold text-lg mb-3">Your details</h2>
      {error === "salary" && (
        <div className="mb-3 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
          Max salary needs to be greater than or equal to min salary.
        </div>
      )}
      <form action={completeProfileAction} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted">Full name</label>
          <input name="name" defaultValue={profile.name} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Current title</label>
          <input name="title" defaultValue={profile.title} placeholder="e.g. Frontend Engineer" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Years of experience</label>
          <input name="years" type="number" min={0} defaultValue={profile.years_experience || undefined} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Skills</label>
          <div className="mt-1"><TagPicker name="skills" options={COMMON_SKILLS} initial={JSON.parse(profile.skills || "[]")} /></div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Languages (optional)</label>
          <div className="mt-1"><LanguagePicker name="languages" initial={JSON.parse(profile.languages || "[]")} /></div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Location</label>
          <div className="mt-1"><LocationSelect name="location" defaultValue={profile.location} required /></div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Date of birth (optional)</label>
          <input name="birthdate" type="date" defaultValue={profile.birthdate || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted">Salary min ($/mo)</label>
            <input name="salaryMin" type="number" defaultValue={profile.salary_min || undefined} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted">Salary max ($/mo)</label>
            <input name="salaryMax" type="number" defaultValue={profile.salary_max || undefined} required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remoteOk" defaultChecked /> Open to remote roles
        </label>
        <div>
          <label className="text-xs font-medium text-muted">About you (2-3 sentences)</label>
          <textarea name="about" defaultValue={profile.about} required rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <button type="submit" className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink w-fit">
          Save & browse roles
        </button>
      </form>
    </div>
  );
}
