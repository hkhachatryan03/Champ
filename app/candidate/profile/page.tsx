import { getSession } from "@/lib/auth";
import { getCandidateProfile, updateCandidateProfile, parseSkills, listExperiences, addExperience, updateExperience, deleteExperience, listCertifications, addCertification, updateCertification, deleteCertification, listEducation, addEducation, updateEducation, deleteEducation, DEGREE_OPTIONS, normalizeAndRegisterTerm, normalizeAndRegisterTerms, listCustomTerms } from "@/lib/queries";
import { formatTermCasing } from "@/lib/termCasing";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Ledger, Tag, LanguageTags } from "@/components/ui";
import { put } from "@vercel/blob";
import { extractTextFromPdf, guessName, guessNameFromLinkedinUrl } from "@/lib/cvParsing";
import ClearableFileInput from "@/components/ClearableFileInput";
import RichEditor from "@/components/RichEditor";
import { sanitizeRichText } from "@/lib/sanitize";
import CroppablePhotoInput from "@/components/CroppablePhotoInput";
import UnsavedChangesGuard from "@/components/UnsavedChangesGuard";
import TagPicker from "@/components/TagPicker";
import LanguagePicker from "@/components/LanguagePicker";
import LocationSelect from "@/components/LocationSelect";
import { COMMON_SKILLS, PROFESSION_OPTIONS, ARMENIAN_UNIVERSITIES } from "@/lib/constants";
import SingleAutocomplete from "@/components/SingleAutocomplete";
import ExperienceItem from "@/components/ExperienceItem";
import EducationItem from "@/components/EducationItem";
import CertificationItem from "@/components/CertificationItem";

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
  const description = String(formData.get("description") || "").trim();
  if (company && title && startYear) {
    const result = await addExperience(session.userId, company, title, startYear, endYear, description);
    if (!result.ok) {
      redirect(`/candidate/profile?expError=${encodeURIComponent(result.error!)}`);
    }
  }
  revalidatePath("/candidate/profile");
}

async function updateExperienceAction(id: number, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") return { ok: false, error: "Not signed in." };
  const company = String(formData.get("company") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const startYear = Number(formData.get("startYear") || 0);
  const endYearRaw = String(formData.get("endYear") || "").trim();
  const endYear = endYearRaw ? Number(endYearRaw) : null;
  const description = String(formData.get("description") || "").trim();
  if (!company || !title || !startYear) return { ok: false, error: "Fill in role, company, and start year." };
  const result = await updateExperience(id, session.userId, company, title, startYear, endYear, description);
  revalidatePath("/candidate/profile");
  return result;
}

async function updateEducationAction(id: number, formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const rawInstitution = String(formData.get("institution") || "").trim();
  const degree = String(formData.get("degree") || "").trim();
  const rawFieldOfStudy = String(formData.get("fieldOfStudy") || "").trim();
  const startYearRaw = String(formData.get("startYear") || "").trim();
  const endYearRaw = String(formData.get("endYear") || "").trim();
  const startYear = startYearRaw ? Number(startYearRaw) : null;
  const endYear = endYearRaw ? Number(endYearRaw) : null;
  if (rawInstitution && degree) {
    const institution = await normalizeAndRegisterTerm("institution", rawInstitution);
    const fieldOfStudy = rawFieldOfStudy ? formatTermCasing(rawFieldOfStudy) : "";
    await updateEducation(id, session.userId, institution, degree, fieldOfStudy, startYear, endYear);
  }
  revalidatePath("/candidate/profile");
}

async function updateCertificationAction(id: number, formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const name = String(formData.get("certName") || "").trim();
  const issueDate = String(formData.get("certIssueDate") || "").trim();
  const provider = String(formData.get("certProvider") || "").trim();
  const linkUrl = String(formData.get("certLink") || "").trim() || null;
  if (name && issueDate) {
    await updateCertification(id, session.userId, name, provider, linkUrl, issueDate);
  }
  revalidatePath("/candidate/profile");
}

async function deleteExperienceAction(id: number) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await deleteExperience(id, session.userId);
  revalidatePath("/candidate/profile");
}

async function addCertificationAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");

  const name = String(formData.get("certName") || "").trim();
  const issueDate = String(formData.get("certIssueDate") || "").trim();
  if (!name || !issueDate) {
    revalidatePath("/candidate/profile");
    return;
  }
  const provider = String(formData.get("certProvider") || "").trim();
  const linkUrl = String(formData.get("certLink") || "").trim() || null;

  let fileUrl: string | null = null;
  const file = formData.get("certFile") as File | null;
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = `cert/${session.userId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const blob = await put(safeName, buffer, { access: "public", contentType: file.type || "application/octet-stream" });
      fileUrl = blob.url;
    } catch (err) {
      console.error("Blob upload failed (certification):", err);
    }
  }

  await addCertification(session.userId, name, provider, linkUrl, fileUrl, issueDate);
  revalidatePath("/candidate/profile");
}

async function deleteCertificationAction(id: number) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await deleteCertification(id, session.userId);
  revalidatePath("/candidate/profile");
}

async function addEducationAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const rawInstitution = String(formData.get("institution") || "").trim();
  const degree = String(formData.get("degree") || "").trim();
  const rawFieldOfStudy = String(formData.get("fieldOfStudy") || "").trim();
  const startYearRaw = String(formData.get("startYear") || "").trim();
  const endYearRaw = String(formData.get("endYear") || "").trim();
  const startYear = startYearRaw ? Number(startYearRaw) : null;
  const endYear = endYearRaw ? Number(endYearRaw) : null;
  if (rawInstitution && degree) {
    const institution = await normalizeAndRegisterTerm("institution", rawInstitution);
    const fieldOfStudy = rawFieldOfStudy ? formatTermCasing(rawFieldOfStudy) : "";
    await addEducation(session.userId, institution, degree, fieldOfStudy, startYear, endYear);
  }
  revalidatePath("/candidate/profile");
}

async function deleteEducationAction(id: number) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await deleteEducation(id, session.userId);
  revalidatePath("/candidate/profile");
}

async function saveProfileAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");

  const name = String(formData.get("name") || "");
  const title = String(formData.get("title") || "");
  const years = Number(formData.get("years") || 0);
  const rawSkills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const skills = await normalizeAndRegisterTerms("skill", rawSkills);
  const languages = String(formData.get("languages") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rawPreferredPositions = String(formData.get("preferredPositions") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const preferredPositions = await normalizeAndRegisterTerms("position", rawPreferredPositions);
  const salaryMin = Number(formData.get("salaryMin") || 0);
  const salaryMax = Number(formData.get("salaryMax") || 0);
  if (salaryMax < salaryMin) redirect("/candidate/profile?error=salary");
  const remoteOk = formData.get("remoteOk") ? 1 : 0;
  const about = sanitizeRichText(String(formData.get("about") || ""));
  const linkedinUrl = String(formData.get("linkedinUrl") || "").trim();
  const location = String(formData.get("location") || "");
  const birthdate = String(formData.get("birthdate") || "").trim() || null;

  let cvUpdate: { cv_filename?: string; name?: string; avatar_url?: string } = {};
  const cvFile = formData.get("cv") as File | null;
  if (cvFile && cvFile.size > 0) {
    const buffer = Buffer.from(await cvFile.arrayBuffer());
    const safeName = `cv/${session.userId}_${Date.now()}_${cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    try {
      const blob = await put(safeName, buffer, { access: "public", contentType: "application/pdf" });
      cvUpdate.cv_filename = blob.url;
    } catch (err) {
      console.error("Blob upload failed:", err);
      redirect("/candidate/profile?error=uploadfailed");
    }
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
    languages: JSON.stringify(languages),
    preferred_positions: JSON.stringify(preferredPositions),
    location,
    birthdate,
    salary_min: salaryMin,
    salary_max: salaryMax,
    remote_ok: remoteOk,
    about,
    linkedin_url: linkedinUrl,
    ...cvUpdate,
  });
  redirect("/candidate/profile");
}

async function updateAvatarAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");

  const avatarFile = formData.get("avatar") as File | null;
  if (!avatarFile || avatarFile.size === 0) return;

  try {
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    const safeName = `avatar/${session.userId}_${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const blob = await put(safeName, buffer, { access: "public", contentType: avatarFile.type || "image/jpeg" });
    await updateCandidateProfile(session.userId, { avatar_url: blob.url });
    revalidatePath("/candidate/profile");
  } catch (err) {
    console.error("Blob upload failed (avatar):", err);
    redirect("/candidate/profile?avatarError=1");
  }
}

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ expError?: string; error?: string; avatarError?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  await requireOnboardedCandidate(session.userId);
  const profile = await getCandidateProfile(session.userId);
  const skills = parseSkills(profile.skills);
  const experiences = await listExperiences(session.userId);
  const certifications = await listCertifications(session.userId);
  const education = await listEducation(session.userId);
  const { expError, error, avatarError } = await searchParams;
  const skillOptions = [...COMMON_SKILLS, ...(await listCustomTerms("skill"))];
  const positionOptions = [...PROFESSION_OPTIONS, ...(await listCustomTerms("position"))];
  const institutionOptions = [...ARMENIAN_UNIVERSITIES, ...(await listCustomTerms("institution"))];

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl">My profile</h1>
        <a href={`/company/candidates/${profile.user_id}`} target="_blank" rel="noopener noreferrer" className="text-xs underline text-apricot-deep whitespace-nowrap">
          Preview as recruiters see me →
        </a>
      </div>

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
        {avatarError === "1" && (
          <div className="mb-3 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
            Your photo failed to upload — try a different file or try again in a moment.
          </div>
        )}
        <div className="flex items-center gap-3">
          <form id="avatarForm" action={updateAvatarAction} encType="multipart/form-data">
            <CroppablePhotoInput name="avatar" existingPhotoUrl={profile.avatar_url} formIdToSubmit="avatarForm" />
          </form>
          <div>
            <div className="font-display font-semibold text-lg">{profile.name || "(no name yet)"}</div>
            <div className="text-sm text-muted">{profile.title} · {profile.years_experience} yrs experience</div>
          </div>
        </div>
        {profile.location && <p className="text-sm text-muted mt-2">📍 {profile.location}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s) => <Tag key={s}>{s}</Tag>)}
          {!!profile.remote_ok && <Tag tone="moss">Remote OK</Tag>}
        </div>
        <div className="mt-3"><Ledger min={profile.salary_min} max={profile.salary_max} /></div>
        {JSON.parse(profile.languages || "[]").length > 0 && (
          <div className="mt-2"><LanguageTags languages={JSON.parse(profile.languages || "[]")} /></div>
        )}
        {profile.cv_filename && (
          <p className="text-sm text-muted mt-3">
            <a href={profile.cv_filename} target="_blank" rel="noopener noreferrer" className="underline">View CV on file</a>
          </p>
        )}
        {profile.linkedin_url && (
          <a
            href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline text-apricot-deep mt-1 block w-fit"
          >
            🔗 {profile.linkedin_url}
          </a>
        )}
      </div>

      <h2 className="font-display font-semibold text-lg mt-8 mb-3">Work experience</h2>
      <div className="flex flex-col gap-2 mb-4">
        {experiences.map((e) => (
          <ExperienceItem key={e.id} experience={e} onUpdate={updateExperienceAction} onDelete={deleteExperienceAction} />
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
        <textarea
          name="description"
          rows={3}
          placeholder="What did you do in this role? (optional)"
          className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none resize-none bg-white"
        />
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper w-fit">
          + Add
        </button>
      </form>

      <h2 className="font-display font-semibold text-lg mb-3">Education</h2>
      <div className="flex flex-col gap-2 mb-4">
        {education.map((e) => (
          <EducationItem
            key={e.id}
            education={e}
            degreeOptions={DEGREE_OPTIONS}
            institutionOptions={institutionOptions}
            onUpdate={updateEducationAction}
            onDelete={deleteEducationAction}
          />
        ))}
        {education.length === 0 && <p className="text-sm text-muted">No education added yet.</p>}
      </div>
      <form action={addEducationAction} className="p-4 rounded-lg bg-paper-dim flex flex-col gap-3 mb-8">
        <div>
          <label className="text-xs font-medium text-muted">School or university (required)</label>
          <div className="mt-1">
            <SingleAutocomplete name="institution" options={institutionOptions} placeholder="Type to search, or enter your own" required />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Degree (required)</label>
          <select name="degree" required className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none">
            <option value="">Choose one</option>
            {DEGREE_OPTIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Field of study (optional)</label>
          <input name="fieldOfStudy" placeholder="e.g. Data Science" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Years (optional)</label>
          <div className="flex gap-2 items-center mt-1">
            <input name="startYear" type="number" placeholder="Start year" className="w-28 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
            <span className="text-sm text-muted">to</span>
            <input name="endYear" type="number" placeholder="End year (blank = present)" className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none font-mono-num" />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper w-fit">
          + Add education
        </button>
      </form>

      <h2 className="font-display font-semibold text-lg mb-3">Certifications</h2>
      <div className="flex flex-col gap-2 mb-4">
        {certifications.map((c) => (
          <CertificationItem key={c.id} certification={c} onUpdate={updateCertificationAction} onDelete={deleteCertificationAction} />
        ))}
        {certifications.length === 0 && <p className="text-sm text-muted">No certifications added yet.</p>}
      </div>
      <form action={addCertificationAction} encType="multipart/form-data" className="p-4 rounded-lg bg-paper-dim flex flex-col gap-3 mb-8">
        <div>
          <label className="text-xs font-medium text-muted">Certificate name (required)</label>
          <input name="certName" required placeholder="e.g. AWS Certified Developer" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Issue date (required)</label>
          <input name="certIssueDate" type="month" required max={new Date().toISOString().slice(0, 7)} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Issued by (optional)</label>
          <input name="certProvider" placeholder="e.g. Amazon Web Services" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Link to certificate (optional)</label>
          <input name="certLink" placeholder="https://..." className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Or attach it (PDF or image, optional)</label>
          <ClearableFileInput name="certFile" accept="application/pdf,image/*" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper w-fit">
          + Add certification
        </button>
      </form>

      <h2 className="font-display font-semibold text-lg mb-3">Edit profile</h2>
      <form id="candidateProfileForm" action={saveProfileAction} encType="multipart/form-data" className="flex flex-col gap-4">
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
          <label className="text-xs font-medium text-muted">Skills</label>
          <div className="mt-1"><TagPicker name="skills" options={skillOptions} initial={skills} /></div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Positions you&apos;re looking for</label>
          <div className="mt-1"><TagPicker name="preferredPositions" options={positionOptions} initial={JSON.parse(profile.preferred_positions || "[]")} /></div>
          <p className="text-xs text-muted mt-1">
            This is what &quot;For You&quot; uses to match you with roles — companies never see this list.
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Languages (optional)</label>
          <div className="mt-1"><LanguagePicker name="languages" initial={JSON.parse(profile.languages || "[]")} /></div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Location</label>
          <div className="mt-1"><LocationSelect name="location" defaultValue={profile.location} /></div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Date of birth (optional)</label>
          <input name="birthdate" type="date" defaultValue={profile.birthdate || ""} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        {error === "salary" && (
          <div className="text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
            Max salary needs to be greater than or equal to min salary.
          </div>
        )}
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
          <RichEditor name="about" defaultValue={profile.about} minHeight={80} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">LinkedIn URL</label>
          <input name="linkedinUrl" defaultValue={profile.linkedin_url} placeholder="linkedin.com/in/yourname" className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none" />
        </div>
        {error === "uploadfailed" && (
          <div className="text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2">
            Something went wrong uploading your CV — your other changes weren't saved either,
            since this happened before we could save. Try again in a moment, or continue
            without a CV update for now.
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-muted">Replace CV (PDF)</label>
          <ClearableFileInput name="cv" />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button type="submit" className="px-5 py-3 rounded-lg font-medium text-sm bg-ink text-paper w-fit">
            Save changes
          </button>
          <a href="/candidate/profile" className="text-sm text-muted underline">
            Cancel
          </a>
        </div>
      </form>
      <UnsavedChangesGuard formId="candidateProfileForm" />
    </div>
  );
}
