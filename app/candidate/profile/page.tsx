import { getSession } from "@/lib/auth";
import { getCandidateProfile, updateCandidateProfile, getCandidateCompletionStatus, parseSkills, listExperiences, addExperience, updateExperience, deleteExperience, listCertifications, addCertification, updateCertification, deleteCertification, listEducation, addEducation, updateEducation, deleteEducation, DEGREE_OPTIONS, normalizeAndRegisterTerm, normalizeAndRegisterTerms, listCustomTerms } from "@/lib/queries";
import { formatTermCasing } from "@/lib/termCasing";
import { requireOnboardedCandidate } from "@/lib/guards";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
import AdminNoticeBanner from "@/components/AdminNoticeBanner";
import GuestPage from "@/components/GuestPage";
import { ArrowRight, FileText, Link2, MapPin, Plus } from "lucide-react";

async function toggleActiveAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "candidate") redirect("/login");
  const next = String(formData.get("next"));
  if (next === "1") {
    const completion = await getCandidateCompletionStatus(session.userId);
    if (!completion.complete) {
      redirect("/candidate/profile?error=incomplete");
    }
  }
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
  const description = sanitizeRichText(String(formData.get("description") || ""));
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
  const description = sanitizeRichText(String(formData.get("description") || ""));
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
  const completion = await getCandidateCompletionStatus(session.userId);
  const skillOptions = [...COMMON_SKILLS, ...(await listCustomTerms("skill"))];
  const positionOptions = [...PROFESSION_OPTIONS, ...(await listCustomTerms("position"))];
  const institutionOptions = [...ARMENIAN_UNIVERSITIES, ...(await listCustomTerms("institution"))];

  const languageList: string[] = JSON.parse(profile.languages || "[]");
  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-14 max-w-[1120px] mx-auto">
        <div className="aur-hero-in flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display font-semibold text-[clamp(34px,5vw,44px)] leading-[1.1] text-paper">My profile</h1>
          <a href={`/company/candidates/${profile.user_id}`} target="_blank" rel="noopener noreferrer" className="text-[13px] underline underline-offset-[3px] text-apricot whitespace-nowrap">
            Preview as recruiters see me →
          </a>
        </div>

        <AdminNoticeBanner glass userId={session.userId} />

        {error === "incomplete" && (
          <div className="aur-alert mt-4 !text-sm !px-4 !py-3 !rounded-2xl">
            Add {completion.missing.join(", ")} before switching to Active.
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[330px_minmax(0,1fr)] gap-7 mt-6 items-start">
          {/* ---------- Left rail: who you are at a glance ---------- */}
          <aside className="lg:sticky lg:top-[96px] flex flex-col gap-3.5">
            <div className="aur-bezel">
              <div className="aur-bezel-inner p-6">
                <div className="flex items-center gap-4">
                  <form id="avatarForm" action={updateAvatarAction} encType="multipart/form-data" className="flex-shrink-0">
                    <CroppablePhotoInput glass name="avatar" existingPhotoUrl={profile.avatar_url} formIdToSubmit="avatarForm" fallbackInitial={(profile.name || "?").charAt(0).toUpperCase()} />
                  </form>
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-[21px] leading-[1.2] text-paper">{profile.name || "(no name yet)"}</div>
                    <div className="text-[13px] text-paper/58 mt-1">{profile.title} · {profile.years_experience} yrs experience</div>
                  </div>
                </div>
                {avatarError === "1" && (
                  <div className="aur-alert mt-3.5 !text-[12.5px]">
                    Your photo failed to upload — try a different file or try again in a moment.
                  </div>
                )}
                {profile.location && (
                  <p className="flex items-center gap-2 text-[13px] text-paper/60 mt-4"><MapPin size={15} strokeWidth={1.4} className="text-apricot" /> {profile.location}</p>
                )}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {skills.map((s) => <span key={s} className="aur-tag">{s}</span>)}
                  {!!profile.remote_ok && <span className="aur-tag aur-tag-ok">Remote OK</span>}
                </div>
                <div className="aur-sal mt-4 w-full">
                  <span>${profile.salary_min}</span>
                  <span className="aur-dots" />
                  <span>${profile.salary_max}</span>
                  <small>/mo</small>
                </div>
                {languageList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {languageList.map((entry) => {
                      const [lang, level] = entry.split(":");
                      return <span key={entry} className="aur-tag">{lang}{level ? ` · ${level}` : ""}</span>;
                    })}
                  </div>
                )}
                {profile.cv_filename && (
                  <a href={profile.cv_filename} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-[13px] underline underline-offset-[3px] text-apricot w-fit">
                    <FileText size={15} strokeWidth={1.4} /> View CV on file
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-[13px] underline underline-offset-[3px] text-apricot w-fit break-all"
                  >
                    <Link2 size={15} strokeWidth={1.4} className="flex-shrink-0" /> {profile.linkedin_url}
                  </a>
                )}
              </div>
            </div>

            <div className="aur-bezel-sm">
              <div className="aur-bezel-inner px-5 py-[18px] flex items-center justify-between gap-3.5">
                <div>
                  <p className="text-sm font-medium text-paper">Actively looking for a job</p>
                  <p className="text-xs leading-[1.55] text-paper/52 mt-0.5">
                    {profile.actively_looking
                      ? "Companies can find you when they search the candidate pool."
                      : completion.complete
                      ? "You're hidden from search, but can still apply to roles directly."
                      : `Complete your profile to switch this on — missing ${completion.missing.join(", ")}.`}
                  </p>
                </div>
                <form action={toggleActiveAction} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <input type="hidden" name="next" value={profile.actively_looking ? "0" : "1"} />
                  <button
                    type="submit"
                    role="switch"
                    aria-checked={!!profile.actively_looking}
                    aria-label="Actively looking for a job"
                    className={`aur-switch ${profile.actively_looking ? "on" : ""}`}
                  />
                  <span className={`text-[10.5px] ${profile.actively_looking ? "text-apricot" : "text-paper/55"}`}>
                    {profile.actively_looking ? "Active" : "Not active"}
                  </span>
                </form>
              </div>
            </div>

            <div className="aur-bezel-sm hidden lg:block">
              <div className="aur-bezel-inner p-2 flex flex-col gap-0.5">
                {[
                  ["#exp", "Work experience", experiences.length],
                  ["#edu", "Education", education.length],
                  ["#cert", "Certifications", certifications.length],
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
            {/* Work experience */}
            <section id="exp" className="scroll-mt-24">
              <h2 className="font-display font-semibold text-2xl mb-4 flex items-baseline gap-3 text-paper">Work experience <small className="font-mono-num text-xs text-paper/40 font-medium">{experiences.length}</small></h2>
              <div className="flex flex-col gap-2.5">
                {experiences.map((e) => (
                  <ExperienceItem glass key={e.id} experience={e} onUpdate={updateExperienceAction} onDelete={deleteExperienceAction} />
                ))}
                {experiences.length === 0 && <p className="text-sm text-paper/50 px-0.5">No work experience added yet.</p>}
              </div>
              {expError && <div className="aur-alert mt-3 !text-sm">{expError}</div>}
              <details className="aur-add" open={!!expError}>
                <summary><Plus size={15} strokeWidth={1.6} /> Add a role</summary>
                <form action={addExperienceAction} className="aur-addform">
                  <div className="flex gap-2.5 max-md:flex-col">
                    <input name="title" placeholder="Title (e.g. Frontend Engineer)" required className="aur-field flex-1" />
                    <input name="company" placeholder="Company" required className="aur-field flex-1" />
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <input name="startYear" type="number" placeholder="Start year" required className="aur-field !w-32 font-mono-num" />
                    <span className="text-sm text-paper/50">to</span>
                    <input name="endYear" type="number" placeholder="End year (blank = present)" className="aur-field flex-1 font-mono-num" />
                  </div>
                  <RichEditor glass name="description" placeholder="What did you do in this role? (optional)" minHeight={70} />
                  <button type="submit" className="aur-btn-sm self-start"><Plus size={14} strokeWidth={1.8} /> Add</button>
                </form>
              </details>
            </section>

            {/* Education */}
            <section id="edu" className="scroll-mt-24">
              <h2 className="font-display font-semibold text-2xl mb-4 flex items-baseline gap-3 text-paper">Education <small className="font-mono-num text-xs text-paper/40 font-medium">{education.length}</small></h2>
              <div className="flex flex-col gap-2.5">
                {education.map((e) => (
                  <EducationItem
                    glass
                    key={e.id}
                    education={e}
                    degreeOptions={DEGREE_OPTIONS}
                    institutionOptions={institutionOptions}
                    onUpdate={updateEducationAction}
                    onDelete={deleteEducationAction}
                  />
                ))}
                {education.length === 0 && <p className="text-sm text-paper/50 px-0.5">No education added yet.</p>}
              </div>
              <details className="aur-add">
                <summary><Plus size={15} strokeWidth={1.6} /> Add education</summary>
                <form action={addEducationAction} className="aur-addform">
                  <div>
                    <label className="aur-label">School or university (required)</label>
                    <SingleAutocomplete glass name="institution" options={institutionOptions} placeholder="Type to search, or enter your own" required />
                  </div>
                  <div>
                    <label className="aur-label">Degree (required)</label>
                    <select name="degree" required className="aur-field">
                      <option value="">Choose one</option>
                      {DEGREE_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="aur-label">Field of study (optional)</label>
                    <input name="fieldOfStudy" placeholder="e.g. Data Science" className="aur-field" />
                  </div>
                  <div>
                    <label className="aur-label">Years (optional)</label>
                    <div className="flex gap-2.5 items-center">
                      <input name="startYear" type="number" placeholder="Start year" className="aur-field !w-32 font-mono-num" />
                      <span className="text-sm text-paper/50">to</span>
                      <input name="endYear" type="number" placeholder="End year (blank = present)" className="aur-field flex-1 font-mono-num" />
                    </div>
                  </div>
                  <button type="submit" className="aur-btn-sm self-start"><Plus size={14} strokeWidth={1.8} /> Add education</button>
                </form>
              </details>
            </section>

            {/* Certifications */}
            <section id="cert" className="scroll-mt-24">
              <h2 className="font-display font-semibold text-2xl mb-4 flex items-baseline gap-3 text-paper">Certifications <small className="font-mono-num text-xs text-paper/40 font-medium">{certifications.length}</small></h2>
              <div className="flex flex-col gap-2.5">
                {certifications.map((c) => (
                  <CertificationItem glass key={c.id} certification={c} onUpdate={updateCertificationAction} onDelete={deleteCertificationAction} />
                ))}
                {certifications.length === 0 && <p className="text-sm text-paper/50 px-0.5">No certifications added yet.</p>}
              </div>
              <details className="aur-add">
                <summary><Plus size={15} strokeWidth={1.6} /> Add certification</summary>
                <form action={addCertificationAction} encType="multipart/form-data" className="aur-addform">
                  <div>
                    <label className="aur-label">Certificate name (required)</label>
                    <input name="certName" required placeholder="e.g. AWS Certified Developer" className="aur-field" />
                  </div>
                  <div>
                    <label className="aur-label">Issue date (required)</label>
                    <input name="certIssueDate" type="month" required max={currentMonth} className="aur-field" />
                  </div>
                  <div>
                    <label className="aur-label">Issued by (optional)</label>
                    <input name="certProvider" placeholder="e.g. Amazon Web Services" className="aur-field" />
                  </div>
                  <div>
                    <label className="aur-label">Link to certificate (optional)</label>
                    <input name="certLink" placeholder="https://..." className="aur-field" />
                  </div>
                  <div>
                    <label className="aur-label">Or attach it (PDF or image, optional)</label>
                    <ClearableFileInput glass name="certFile" accept="application/pdf,image/*" />
                  </div>
                  <button type="submit" className="aur-btn-sm self-start"><Plus size={14} strokeWidth={1.8} /> Add certification</button>
                </form>
              </details>
            </section>

            {/* Edit profile */}
            <section id="edit" className="scroll-mt-24">
              <h2 className="font-display font-semibold text-2xl mb-4 text-paper">Edit profile</h2>
              <form id="candidateProfileForm" action={saveProfileAction} encType="multipart/form-data" className="flex flex-col gap-4">
                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner aur-fs">
                    <h3>The basics</h3>
                    <div>
                      <label className="aur-label">Full name</label>
                      <input name="name" defaultValue={profile.name} required className="aur-field" />
                    </div>
                    <div>
                      <label className="aur-label">Current title</label>
                      <input name="title" defaultValue={profile.title} required className="aur-field" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="aur-label">Years of experience</label>
                        <input name="years" type="number" defaultValue={profile.years_experience} className="aur-field font-mono-num" />
                      </div>
                      <div>
                        <label className="aur-label">Date of birth (optional)</label>
                        <input name="birthdate" type="date" defaultValue={profile.birthdate || ""} className="aur-field" />
                      </div>
                    </div>
                    <div>
                      <label className="aur-label">Location</label>
                      <LocationSelect glass name="location" defaultValue={profile.location} />
                    </div>
                  </div>
                </div>

                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner aur-fs">
                    <h3>Skills &amp; preferences</h3>
                    <div>
                      <label className="aur-label">Skills</label>
                      <TagPicker glass name="skills" options={skillOptions} initial={skills} />
                    </div>
                    <div>
                      <label className="aur-label">Positions you&apos;re looking for</label>
                      <TagPicker glass name="preferredPositions" options={positionOptions} initial={JSON.parse(profile.preferred_positions || "[]")} />
                      <p className="text-xs leading-[1.55] text-paper/50 mt-1.5">
                        This is what &quot;For You&quot; uses to match you with roles — companies never see this list.
                      </p>
                    </div>
                    <div>
                      <label className="aur-label">Languages (optional)</label>
                      <LanguagePicker glass name="languages" initial={JSON.parse(profile.languages || "[]")} />
                    </div>
                    {error === "salary" && (
                      <div className="aur-alert !text-[13px]">
                        Max salary needs to be greater than or equal to min salary.
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="aur-label">Salary min ($/mo)</label>
                        <input name="salaryMin" type="number" defaultValue={profile.salary_min} className="aur-field font-mono-num" />
                      </div>
                      <div>
                        <label className="aur-label">Salary max ($/mo)</label>
                        <input name="salaryMax" type="number" defaultValue={profile.salary_max} className="aur-field font-mono-num" />
                      </div>
                    </div>
                    <label className="aur-check !text-sm">
                      <input type="checkbox" name="remoteOk" defaultChecked={!!profile.remote_ok} />
                      <span className="aur-check-box"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
                      Open to remote roles
                    </label>
                  </div>
                </div>

                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner aur-fs">
                    <h3>About you</h3>
                    <RichEditor glass name="about" defaultValue={profile.about} minHeight={110} />
                  </div>
                </div>

                <div className="aur-bezel-sm">
                  <div className="aur-bezel-inner aur-fs">
                    <h3>Links &amp; CV</h3>
                    <div>
                      <label className="aur-label">LinkedIn URL</label>
                      <input name="linkedinUrl" defaultValue={profile.linkedin_url} placeholder="linkedin.com/in/yourname" className="aur-field" />
                    </div>
                    {error === "uploadfailed" && (
                      <div className="aur-alert !text-[13px] !leading-[1.55]">
                        Something went wrong uploading your CV — your other changes weren&apos;t saved either,
                        since this happened before we could save. Try again in a moment, or continue
                        without a CV update for now.
                      </div>
                    )}
                    <div>
                      <label className="aur-label">Replace CV (PDF)</label>
                      <ClearableFileInput glass name="cv" />
                    </div>
                  </div>
                </div>

                <div className="aur-savebar">
                  <span className="aur-savehint">
                    <span className="aur-sh-clean">All changes saved</span>
                    <span className="aur-sh-dirty">You have unsaved changes</span>
                  </span>
                  <div className="flex items-center gap-1.5 max-md:w-full max-md:justify-between">
                    <a href="/candidate/profile" className="px-4 py-2.5 text-[13.5px] text-paper/65 hover:text-paper underline underline-offset-[3px] transition-colors">Cancel</a>
                    <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine !py-3 !pl-[22px] !pr-2">
                      Save changes
                      <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                    </button>
                  </div>
                </div>
              </form>
              <UnsavedChangesGuard glass formId="candidateProfileForm" />
            </section>
          </div>
        </div>
      </div>
    </GuestPage>
  );
}
