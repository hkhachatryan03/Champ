import { getSession } from "@/lib/auth";
import { getCandidateProfile, updateCandidateProfile, listExperiences, addExperience, deleteExperience, isEmailVerified, normalizeAndRegisterTerms, listCustomTerms } from "@/lib/queries";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { extractTextFromPdf, guessName, guessNameFromLinkedinUrl } from "@/lib/cvParsing";
import ClearableFileInput from "@/components/ClearableFileInput";
import GuestPage from "@/components/GuestPage";
import { ArrowLeft, ArrowRight, Check, Link2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import RichEditor from "@/components/RichEditor";
import { sanitizeRichText } from "@/lib/sanitize";
import TagPicker from "@/components/TagPicker";
import LanguagePicker from "@/components/LanguagePicker";
import LocationSelect from "@/components/LocationSelect";
import { COMMON_SKILLS, PROFESSION_OPTIONS } from "@/lib/constants";

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
  const method = String(formData.get("method") || "manual");
  if (salaryMax < salaryMin) {
    redirect(`/candidate/onboarding?method=${method}&step=details&error=salary`);
  }
  const remoteOk = formData.get("remoteOk") ? 1 : 0;
  const about = sanitizeRichText(String(formData.get("about") || ""));
  const location = String(formData.get("location") || "");
  const birthdate = String(formData.get("birthdate") || "").trim() || null;

  await updateCandidateProfile(session.userId, {
    name,
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
    onboarded: 1,
  });

  redirect("/candidate/jobs");
}

const Steps = ({ n, total }: { n: number; total: number }) => (
  <div className="aur-steps">
    {Array.from({ length: total }).map((_, i) => (
      <i key={i} className={i < n ? "on" : ""} />
    ))}
    <em>Step {n} of {total}</em>
  </div>
);

const BackLink = () => (
  <a href="/candidate/onboarding" className="aur-hero-in inline-flex items-center gap-2 text-[13.5px] text-paper/60 hover:text-paper hover:-translate-x-[3px] transition-[color,transform] duration-300">
    <ArrowLeft size={16} strokeWidth={1.25} /> Change method
  </a>
);

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
      <GuestPage>
        <div className="px-6 pt-[calc(var(--nav-h)+2.5rem)] pb-20 max-w-[600px] mx-auto">
          <div className="aur-hero-in"><Steps n={1} total={3} /></div>
          <h1 className="aur-hero-in font-display font-semibold text-[clamp(32px,5vw,42px)] leading-[1.12] text-paper mt-3.5" style={{ animationDelay: ".06s" }}>Build your profile</h1>
          <p className="aur-hero-in text-[15px] leading-[1.65] text-paper/62 mt-3 mb-[26px]" style={{ animationDelay: ".12s" }}>
            This is what companies will see. Pick whichever is fastest.
          </p>
          <div className="aur-hero-in flex flex-col gap-3" style={{ animationDelay: ".18s" }}>
            {[
              ["manual", "Fill it in manually", <Pencil key="i" size={18} strokeWidth={1.25} />],
              ["linkedin", "Import from LinkedIn", <Link2 key="i" size={18} strokeWidth={1.25} />],
              ["cv", "Upload my CV", <Upload key="i" size={18} strokeWidth={1.25} />],
            ].map(([m, label, icon]) => (
              <a key={m as string} href={`/candidate/onboarding?method=${m}`} className="group block">
                <div className="aur-bezel-sm transition-[transform,border-color] duration-500 group-hover:-translate-y-0.5 group-hover:border-apricot/35">
                  <div className="aur-bezel-inner flex items-center gap-4 px-5 py-[18px]">
                    <span className="aur-icon-chip">{icon}</span>
                    <b className="flex-1 text-base font-medium text-paper">{label}</b>
                    <span className="w-[34px] h-[34px] rounded-full border border-paper/15 flex items-center justify-center text-paper/60 group-hover:border-apricot group-hover:text-apricot group-hover:translate-x-[3px] transition-all duration-300">
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </GuestPage>
    );
  }

  // --- Screen 2a: CV upload (before it's attached) ---
  if (method === "cv" && !profile.cv_filename && step !== "details") {
    return (
      <GuestPage>
        <div className="px-6 pt-[calc(var(--nav-h)+2rem)] pb-20 max-w-[600px] mx-auto">
          <BackLink />
          <div className="aur-hero-in mt-[18px]"><Steps n={2} total={3} /></div>
          <h1 className="aur-hero-in font-display font-semibold text-[clamp(32px,5vw,42px)] leading-[1.12] text-paper mt-3.5" style={{ animationDelay: ".08s" }}>Upload your CV</h1>
          <p className="aur-hero-in text-[15px] leading-[1.65] text-paper/62 mt-3 mb-[26px]" style={{ animationDelay: ".14s" }}>
            We&apos;ll pull your name from it automatically where we can, then
            you&apos;ll confirm and fill in anything left over on the next screen.
          </p>
          <div className="aur-hero-in aur-bezel" style={{ animationDelay: ".2s" }}>
            <div className="aur-bezel-inner p-7">
              {error === "nofile" && (
                <div className="aur-alert mb-4 !text-[13.5px] !leading-[1.55] !px-3.5 !py-[11px] !rounded-[13px]">
                  Please choose a PDF file first.
                </div>
              )}
              {error === "uploadfailed" && (
                <div className="aur-alert mb-4 !text-[13.5px] !leading-[1.55] !px-3.5 !py-[11px] !rounded-[13px]">
                  Something went wrong uploading your CV — this usually means file storage isn&apos;t
                  configured yet on this deployment. You can still finish your profile now and
                  add your CV later from &quot;My profile.&quot;
                </div>
              )}
              <form action={uploadCvAction} encType="multipart/form-data" className="flex flex-col gap-[18px]">
                <ClearableFileInput glass name="cv" required />
                <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine self-start !py-[13px] !pl-6 !pr-2">
                  Upload &amp; continue
                  <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                </button>
              </form>
            </div>
          </div>
          <a href="/candidate/onboarding?method=cv&step=details" className="inline-block mt-[18px] text-[12.5px] text-paper/55 hover:text-paper underline underline-offset-[3px] transition-colors">
            Skip for now, I&apos;ll add my CV later
          </a>
        </div>
      </GuestPage>
    );
  }

  // --- Screen 2b: LinkedIn URL (before it's attached) ---
  if (method === "linkedin" && !profile.linkedin_url) {
    return (
      <GuestPage>
        <div className="px-6 pt-[calc(var(--nav-h)+2rem)] pb-20 max-w-[600px] mx-auto">
          <BackLink />
          <div className="aur-hero-in mt-[18px]"><Steps n={2} total={3} /></div>
          <h1 className="aur-hero-in font-display font-semibold text-[clamp(32px,5vw,42px)] leading-[1.12] text-paper mt-3.5" style={{ animationDelay: ".08s" }}>Import from LinkedIn</h1>
          <p className="aur-hero-in text-[15px] leading-[1.65] text-paper/62 mt-3 mb-[26px]" style={{ animationDelay: ".14s" }}>
            We can&apos;t fetch real LinkedIn data without their official API, but
            we&apos;ll take a best guess at your name from the profile URL itself —
            you&apos;ll confirm everything else on the next screen.
          </p>
          <div className="aur-hero-in aur-bezel" style={{ animationDelay: ".2s" }}>
            <div className="aur-bezel-inner p-7">
              {error === "nourl" && (
                <div className="aur-alert mb-4 !text-[13.5px] !leading-[1.55] !px-3.5 !py-[11px] !rounded-[13px]">
                  Please paste your LinkedIn URL first.
                </div>
              )}
              <form action={saveLinkedinAction} className="flex flex-col gap-[18px]">
                <div>
                  <label className="aur-label">LinkedIn URL</label>
                  <input name="linkedinUrl" required placeholder="linkedin.com/in/yourname" className="aur-field" />
                </div>
                <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine self-start !py-[13px] !pl-6 !pr-2">
                  Continue
                  <span className="aur-btn-icon"><ArrowRight size={14} /></span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </GuestPage>
    );
  }

  // --- Screen 3: full details, pre-filled with whatever we already know ---
  const cameFromImport = method === "cv" || method === "linkedin";
  const experiences = await listExperiences(session.userId);
  const skillOptions = [...COMMON_SKILLS, ...(await listCustomTerms("skill"))];
  const positionOptions = [...PROFESSION_OPTIONS, ...(await listCustomTerms("position"))];
  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2rem)] pb-20 max-w-[760px] mx-auto">
        <BackLink />
        <div className="aur-hero-in mt-[18px]"><Steps n={cameFromImport ? 3 : 2} total={cameFromImport ? 3 : 2} /></div>
        <h1 className="aur-hero-in font-display font-semibold text-[clamp(32px,5vw,42px)] leading-[1.12] text-paper mt-3.5" style={{ animationDelay: ".08s" }}>Complete your profile</h1>
        <p className="aur-hero-in text-[15px] leading-[1.65] text-paper/62 mt-3 mb-[26px]" style={{ animationDelay: ".14s" }}>
          {cameFromImport
            ? "We've filled in what we could — please check it and add anything missing."
            : "Fill in your details below."}
        </p>
        {(profile.cv_filename || profile.linkedin_url) && (
          <div className="flex flex-wrap gap-2 mb-[22px]">
            {profile.cv_filename && (
              <span className="inline-flex items-center gap-[7px] text-[12.5px] px-[13px] py-1.5 rounded-full bg-[rgba(127,176,138,.12)] border border-[rgba(127,176,138,.35)] text-[#A9D8B2]">
                <Check size={13} strokeWidth={2} /> CV on file
              </span>
            )}
            {profile.linkedin_url && (
              <span className="inline-flex items-center gap-[7px] text-[12.5px] px-[13px] py-1.5 rounded-full bg-[rgba(127,176,138,.12)] border border-[rgba(127,176,138,.35)] text-[#A9D8B2] break-all">
                <Check size={13} strokeWidth={2} /> LinkedIn on file:{" "}
                <a
                  href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-[3px]"
                >
                  {profile.linkedin_url}
                </a>
              </span>
            )}
          </div>
        )}

        <div className="aur-bezel-sm">
          <div className="aur-bezel-inner aur-fs">
            <h3>Work experience</h3>
            <p className="text-[12.5px] text-paper/50 -mt-1">
              Add your past roles now, or skip and add them later from &quot;My profile.&quot;
            </p>
            <div className="flex flex-col gap-2.5">
              {experiences.map((e) => (
                <div key={e.id} className="aur-entry">
                  <div className="flex items-start justify-between gap-3.5">
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium text-paper">{e.title} · {e.company}</div>
                      <div className="text-xs text-paper/50 font-mono-num mt-0.5">{e.start_year} – {e.end_year || "Present"}</div>
                    </div>
                    <form action={deleteExperienceOnboardingAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="method" value={method} />
                      <button type="submit" className="aur-entry-btn"><Trash2 size={13} strokeWidth={1.5} /> Remove</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            {expError && (
              <div className="aur-alert !text-[13.5px] !px-3.5 !py-[11px] !rounded-[13px]">{expError}</div>
            )}
            <form action={addExperienceOnboardingAction} className="aur-addform !mt-0">
              <input type="hidden" name="method" value={method} />
              <div className="grid sm:grid-cols-2 gap-2.5">
                <input name="title" placeholder="Title (e.g. Frontend Engineer)" className="aur-field" />
                <input name="company" placeholder="Company" className="aur-field" />
              </div>
              <div className="flex gap-2.5 items-center">
                <input name="startYear" type="number" placeholder="Start year" className="aur-field !w-32 font-mono-num" />
                <span className="text-sm text-paper/50">to</span>
                <input name="endYear" type="number" placeholder="End year (blank = present)" className="aur-field flex-1 font-mono-num" />
              </div>
              <button type="submit" className="aur-btn-sm self-start"><Plus size={14} strokeWidth={1.8} /> Add role</button>
            </form>
          </div>
        </div>

        <form action={completeProfileAction} className="flex flex-col gap-4 mt-4">
          {error === "salary" && (
            <div className="aur-alert !text-[13.5px] !px-3.5 !py-[11px] !rounded-[13px]">
              Max salary needs to be greater than or equal to min salary.
            </div>
          )}
          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>Your details</h3>
              <div>
                <label className="aur-label">Full name</label>
                <input name="name" defaultValue={profile.name} required className="aur-field" />
              </div>
              <div>
                <label className="aur-label">Current title</label>
                <input name="title" defaultValue={profile.title} placeholder="e.g. Frontend Engineer" className="aur-field" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="aur-label">Years of experience</label>
                  <input name="years" type="number" min={0} defaultValue={profile.years_experience || undefined} className="aur-field font-mono-num" />
                </div>
                <div>
                  <label className="aur-label">Date of birth (optional)</label>
                  <input name="birthdate" type="date" defaultValue={profile.birthdate || ""} className="aur-field" />
                </div>
              </div>
              <div>
                <label className="aur-label">Location</label>
                <LocationSelect glass name="location" defaultValue={profile.location} required />
              </div>
            </div>
          </div>

          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>Skills &amp; preferences</h3>
              <div>
                <label className="aur-label">Skills</label>
                <TagPicker glass name="skills" options={skillOptions} initial={JSON.parse(profile.skills || "[]")} />
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
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="aur-label">Salary min ($/mo)</label>
                  <input name="salaryMin" type="number" defaultValue={profile.salary_min || undefined} required className="aur-field font-mono-num" />
                </div>
                <div>
                  <label className="aur-label">Salary max ($/mo)</label>
                  <input name="salaryMax" type="number" defaultValue={profile.salary_max || undefined} required className="aur-field font-mono-num" />
                </div>
              </div>
              <label className="aur-check !text-sm">
                <input type="checkbox" name="remoteOk" defaultChecked />
                <span className="aur-check-box"><Check size={12} strokeWidth={2.4} /></span>
                Open to remote roles
              </label>
            </div>
          </div>

          <div className="aur-bezel-sm">
            <div className="aur-bezel-inner aur-fs">
              <h3>About you (2-3 sentences)</h3>
              <RichEditor glass name="about" defaultValue={profile.about} required minHeight={96} />
            </div>
          </div>

          <button type="submit" className="aur-btn aur-btn-primary aur-btn-shine justify-center w-full !py-3.5 !pl-6 !pr-2">
            Save &amp; browse roles
            <span className="aur-btn-icon"><ArrowRight size={14} /></span>
          </button>
        </form>
      </div>
    </GuestPage>
  );
}
