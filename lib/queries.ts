import sql from "./db";

export type CandidateProfile = {
  user_id: number;
  name: string;
  title: string;
  years_experience: number;
  skills: string; // JSON array string
  languages: string; // JSON array string, e.g. ["English:C1", "Russian:Native"]
  preferred_positions: string; // JSON array string — hidden from companies, used only for "For You" matching
  location: string;
  birthdate: string | null;
  avatar_url: string | null;
  salary_min: number;
  salary_max: number;
  remote_ok: number;
  cv_filename: string | null;
  linkedin_url: string;
  about: string;
  actively_looking: number;
  onboarded: number;
};

export type CompanyProfile = {
  user_id: number;
  name: string;
  recruiter_name: string;
  industry: string;
  size: string;
  website: string;
  address: string;
  phone: string;
  about: string;
  avatar_url: string | null;
  verified: number;
  onboarded: number;
};

export type Job = {
  id: number;
  company_user_id: number;
  title: string;
  category: "Tech" | "Non-tech";
  employment_type: "Full-time" | "Part-time";
  location: string;
  remote: number;
  salary_min: number;
  salary_max: number;
  skills: string;
  description: string;
  active: number;
  archived_at: string | null;
  created_at: string;
  experience_level: string | null;
  languages: string;
};

export type Application = {
  id: number;
  job_id: number;
  candidate_user_id: number;
  cover_note: string;
  cv_filename: string | null;
  expected_salary: number | null;
  status: "New" | "Interviewing" | "Offer" | "Hired" | "Not moving forward";
  invite_status: "pending" | "accepted" | "declined" | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  application_id: number;
  sender_role: "candidate" | "company";
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export const parseSkills = (skillsJson: string): string[] => {
  try {
    return JSON.parse(skillsJson);
  } catch {
    return [];
  }
};

// ---------- Candidate profile ----------
export async function getCandidateProfile(userId: number): Promise<CandidateProfile> {
  const rows = await sql`SELECT * FROM candidate_profiles WHERE user_id = ${userId}`;
  return rows[0] as CandidateProfile;
}

export async function updateCandidateProfile(
  userId: number,
  fields: Partial<Omit<CandidateProfile, "user_id">>
) {
  const current = await getCandidateProfile(userId);
  const m = { ...current, ...fields };
  await sql`
    UPDATE candidate_profiles SET
      name = ${m.name}, title = ${m.title}, years_experience = ${m.years_experience},
      skills = ${m.skills}, languages = ${m.languages}, preferred_positions = ${m.preferred_positions},
      location = ${m.location},
      birthdate = ${m.birthdate}, avatar_url = ${m.avatar_url},
      salary_min = ${m.salary_min}, salary_max = ${m.salary_max},
      remote_ok = ${m.remote_ok}, cv_filename = ${m.cv_filename},
      linkedin_url = ${m.linkedin_url}, about = ${m.about},
      actively_looking = ${m.actively_looking}, onboarded = ${m.onboarded}
    WHERE user_id = ${userId}
  `;
}

// ---------- Company profile ----------
export async function getCompanyProfile(userId: number): Promise<CompanyProfile> {
  const rows = await sql`SELECT * FROM company_profiles WHERE user_id = ${userId}`;
  return rows[0] as CompanyProfile;
}

export async function updateCompanyProfile(
  userId: number,
  fields: Partial<Omit<CompanyProfile, "user_id">>
) {
  const current = await getCompanyProfile(userId);
  const m = { ...current, ...fields };
  await sql`
    UPDATE company_profiles SET
      name = ${m.name}, recruiter_name = ${m.recruiter_name}, industry = ${m.industry}, size = ${m.size},
      website = ${m.website}, address = ${m.address}, phone = ${m.phone},
      about = ${m.about}, avatar_url = ${m.avatar_url},
      verified = ${m.verified}, onboarded = ${m.onboarded}
    WHERE user_id = ${userId}
  `;
}

// ---------- Jobs ----------
export type JobFilters = {
  position?: string;
  company?: string;
  category?: string;
  employmentType?: string;
  experienceLevel?: string;
  remote?: string; // "remote" | "onsite" | ""
  location?: string;
  language?: string;
  salaryMin?: string;
  salaryMax?: string;
  hideApplied?: string;
};

export async function listDistinctJobTitles(): Promise<string[]> {
  const rows = (await sql`
    SELECT DISTINCT title FROM jobs WHERE active = 1 ORDER BY title ASC
  `) as { title: string }[];
  return rows.map((r) => r.title);
}

export async function listDistinctCompanyNames(): Promise<string[]> {
  const rows = (await sql`
    SELECT DISTINCT name FROM company_profiles WHERE onboarded = 1 AND name != '' ORDER BY name ASC
  `) as { name: string }[];
  return rows.map((r) => r.name);
}

export async function listDistinctCandidateTitles(): Promise<string[]> {
  const rows = (await sql`
    SELECT DISTINCT title FROM candidate_profiles
    WHERE actively_looking = 1 AND onboarded = 1 AND title != ''
    ORDER BY title ASC
  `) as { title: string }[];
  return rows.map((r) => r.title);
}

export async function listActiveJobsWithCompany(filters: JobFilters = {}) {
  const rows = (await sql`
    SELECT jobs.*, company_profiles.name as company_name, company_profiles.verified as company_verified
    FROM jobs
    JOIN company_profiles ON company_profiles.user_id = jobs.company_user_id
    WHERE jobs.active = 1
    ORDER BY jobs.created_at DESC
  `) as (Job & { company_name: string; company_verified: number })[];

  return rows.filter((j) => {
    if (filters.position) {
      const wanted = filters.position.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (wanted.length && !wanted.some((w) => j.title.toLowerCase().includes(w))) return false;
    }
    if (filters.company) {
      const wanted = filters.company.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (wanted.length && !wanted.some((w) => j.company_name.toLowerCase().includes(w))) return false;
    }
    if (filters.category && j.category !== filters.category) return false;
    if (filters.employmentType && j.employment_type !== filters.employmentType) return false;
    if (filters.experienceLevel && j.experience_level !== filters.experienceLevel) return false;
    if (filters.remote === "remote" && !j.remote) return false;
    if (filters.remote === "onsite" && j.remote) return false;
    if (filters.location && !j.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.salaryMin && j.salary_max < Number(filters.salaryMin)) return false;
    if (filters.salaryMax && j.salary_min > Number(filters.salaryMax)) return false;
    return true;
  });
}

export async function getJobWithCompany(jobId: number) {
  const rows = (await sql`
    SELECT jobs.*, company_profiles.name as company_name, company_profiles.verified as company_verified
    FROM jobs JOIN company_profiles ON company_profiles.user_id = jobs.company_user_id
    WHERE jobs.id = ${jobId}
  `) as (Job & { company_name: string; company_verified: number })[];
  return rows[0] as (Job & { company_name: string; company_verified: number }) | undefined;
}

export async function listActiveJobsForCompanyPublic(companyUserId: number) {
  return (await sql`
    SELECT * FROM jobs WHERE company_user_id = ${companyUserId} AND active = 1 ORDER BY created_at DESC
  `) as Job[];
}

export async function listJobsForCompany(companyUserId: number) {
  return (await sql`
    SELECT * FROM jobs WHERE company_user_id = ${companyUserId} ORDER BY created_at DESC
  `) as Job[];
}

export async function createJob(
  companyUserId: number,
  data: Omit<Job, "id" | "company_user_id" | "active" | "created_at" | "archived_at">
) {
  const rows = await sql`
    INSERT INTO jobs
      (company_user_id, title, category, employment_type, location, remote, salary_min, salary_max, skills, description, experience_level, languages)
    VALUES (${companyUserId}, ${data.title}, ${data.category}, ${data.employment_type}, ${data.location},
            ${data.remote}, ${data.salary_min}, ${data.salary_max}, ${data.skills}, ${data.description},
            ${data.experience_level}, ${data.languages})
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function updateJob(
  jobId: number,
  companyUserId: number,
  data: Partial<Omit<Job, "id" | "company_user_id" | "created_at">>
) {
  const rows = (await sql`
    SELECT * FROM jobs WHERE id = ${jobId} AND company_user_id = ${companyUserId}
  `) as Job[];
  const current = rows[0];
  if (!current) throw new Error("Job not found or not owned by this company");
  const m = { ...current, ...data };
  await sql`
    UPDATE jobs SET title=${m.title}, category=${m.category}, employment_type=${m.employment_type},
      location=${m.location}, remote=${m.remote}, salary_min=${m.salary_min}, salary_max=${m.salary_max},
      skills=${m.skills}, description=${m.description}, active=${m.active},
      experience_level=${m.experience_level}, languages=${m.languages}
    WHERE id=${jobId} AND company_user_id=${companyUserId}
  `;
}

export async function getLandingStats() {
  const [jobsRow] = await sql`SELECT COUNT(*) as n FROM jobs WHERE active = 1`;
  const [candRow] = await sql`
    SELECT COUNT(*) as n FROM candidate_profiles WHERE actively_looking = 1 AND onboarded = 1
  `;
  const [compRow] = await sql`SELECT COUNT(*) as n FROM company_profiles WHERE onboarded = 1`;
  return {
    activeJobs: Number(jobsRow.n),
    activeCandidates: Number(candRow.n),
    companies: Number(compRow.n),
  };
}

export async function getAppliedJobIds(candidateUserId: number): Promise<Set<number>> {
  const rows = (await sql`
    SELECT job_id FROM applications WHERE candidate_user_id = ${candidateUserId}
  `) as { job_id: number }[];
  return new Set(rows.map((r) => r.job_id));
}

export async function findApplication(jobId: number, candidateUserId: number) {
  const rows = (await sql`
    SELECT id, status, expected_salary FROM applications WHERE job_id = ${jobId} AND candidate_user_id = ${candidateUserId}
  `) as { id: number; status: string; expected_salary: number | null }[];
  return rows[0] as { id: number; status: string; expected_salary: number | null } | undefined;
}

// ---------- Applications ----------
export async function createApplication(
  jobId: number,
  candidateUserId: number,
  coverNote: string,
  cvFilename: string | null,
  expectedSalary: number | null,
  inviteStatus: "pending" | null = null
) {
  const rows = await sql`
    INSERT INTO applications (job_id, candidate_user_id, cover_note, cv_filename, expected_salary, invite_status)
    VALUES (${jobId}, ${candidateUserId}, ${coverNote}, ${cvFilename}, ${expectedSalary}, ${inviteStatus})
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function updateInviteStatus(applicationId: number, inviteStatus: "accepted" | "declined") {
  await sql`UPDATE applications SET invite_status = ${inviteStatus} WHERE id = ${applicationId}`;
}

export async function listApplicationsForCandidate(candidateUserId: number) {
  return (await sql`
    SELECT applications.*, jobs.title as job_title, jobs.company_user_id as company_user_id,
      company_profiles.name as company_name, company_profiles.recruiter_name as recruiter_name,
      (SELECT COUNT(*) FROM messages m WHERE m.application_id = applications.id AND m.sender_role = 'company' AND m.read_at IS NULL) as unread_count,
      (SELECT MAX(created_at) FROM messages m WHERE m.application_id = applications.id) as last_message_at
    FROM applications
    JOIN jobs ON jobs.id = applications.job_id
    JOIN company_profiles ON company_profiles.user_id = jobs.company_user_id
    WHERE applications.candidate_user_id = ${candidateUserId}
    ORDER BY applications.updated_at DESC
  `) as any[];
}

export async function listApplicationsForCompany(companyUserId: number) {
  return (await sql`
    SELECT applications.*, jobs.title as job_title, candidate_profiles.name as candidate_name,
      candidate_profiles.title as candidate_title, candidate_profiles.skills as candidate_skills,
      candidate_profiles.avatar_url as candidate_avatar_url,
      (SELECT COUNT(*) FROM messages m WHERE m.application_id = applications.id AND m.sender_role = 'candidate' AND m.read_at IS NULL) as unread_count,
      (SELECT COUNT(*) FROM messages m WHERE m.application_id = applications.id AND m.sender_role = 'company') as company_reply_count
    FROM applications
    JOIN jobs ON jobs.id = applications.job_id
    JOIN candidate_profiles ON candidate_profiles.user_id = applications.candidate_user_id
    WHERE jobs.company_user_id = ${companyUserId}
    ORDER BY applications.updated_at DESC
  `) as any[];
}

export async function listApplicationsForJob(jobId: number, companyUserId: number) {
  return (await sql`
    SELECT applications.*, candidate_profiles.name as candidate_name,
      candidate_profiles.title as candidate_title, candidate_profiles.skills as candidate_skills,
      jobs.company_user_id as job_company_user_id
    FROM applications
    JOIN jobs ON jobs.id = applications.job_id
    JOIN candidate_profiles ON candidate_profiles.user_id = applications.candidate_user_id
    WHERE applications.job_id = ${jobId} AND jobs.company_user_id = ${companyUserId}
    ORDER BY applications.updated_at DESC
  `) as any[];
}

export async function getApplicationContext(applicationId: number) {
  const rows = (await sql`
    SELECT applications.*, jobs.title as job_title, jobs.company_user_id as company_user_id,
      jobs.active as job_active, jobs.archived_at as job_archived_at,
      company_profiles.name as company_name, company_profiles.recruiter_name as recruiter_name,
      company_profiles.avatar_url as company_avatar_url,
      candidate_profiles.name as candidate_name, candidate_profiles.linkedin_url as candidate_linkedin_url,
      candidate_profiles.cv_filename as candidate_cv_filename, candidate_profiles.avatar_url as candidate_avatar_url,
      company_users.last_seen_at as company_last_seen_at, candidate_users.last_seen_at as candidate_last_seen_at
    FROM applications
    JOIN jobs ON jobs.id = applications.job_id
    JOIN company_profiles ON company_profiles.user_id = jobs.company_user_id
    JOIN candidate_profiles ON candidate_profiles.user_id = applications.candidate_user_id
    JOIN users company_users ON company_users.id = jobs.company_user_id
    JOIN users candidate_users ON candidate_users.id = applications.candidate_user_id
    WHERE applications.id = ${applicationId}
  `) as any[];
  return rows[0];
}

export async function updateApplicationStatus(applicationId: number, status: string) {
  await sql`
    UPDATE applications SET status = ${status}, updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE id = ${applicationId}
  `;
}

export async function closeJobForApplication(applicationId: number) {
  // A confirmed hire automatically archives the role — not just pauses
  // it — since the position is genuinely filled, not just temporarily on
  // hold.
  await sql`
    UPDATE jobs SET active = 0, archived_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE id = (SELECT job_id FROM applications WHERE id = ${applicationId})
  `;
}

export async function archiveJob(jobId: number, companyUserId: number) {
  await sql`
    UPDATE jobs SET active = 0, archived_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE id = ${jobId} AND company_user_id = ${companyUserId}
  `;
}

export async function restoreArchivedJob(jobId: number, companyUserId: number) {
  await sql`
    UPDATE jobs SET archived_at = NULL
    WHERE id = ${jobId} AND company_user_id = ${companyUserId}
  `;
}

// Permanently deletes any job archived more than 90 days ago, per the
// restore-within-3-months policy — cascades to its applications and
// messages automatically via the foreign keys.
export async function permanentlyDeleteExpiredArchivedJobs(): Promise<number> {
  const rows = (await sql`
    DELETE FROM jobs
    WHERE archived_at IS NOT NULL AND archived_at::timestamp < (now() - interval '90 days')
    RETURNING id
  `) as { id: number }[];
  return rows.length;
}

// ---------- Messages ----------
export async function listMessages(applicationId: number, limit: number = 30): Promise<Message[]> {
  const rows = (await sql`
    SELECT * FROM messages WHERE application_id = ${applicationId}
    ORDER BY created_at DESC, id DESC LIMIT ${limit}
  `) as Message[];
  return rows.reverse(); // oldest-first for display, even though we fetched newest-first
}

export async function countMessages(applicationId: number): Promise<number> {
  const rows = (await sql`SELECT COUNT(*) as n FROM messages WHERE application_id = ${applicationId}`) as { n: number }[];
  return Number(rows[0].n);
}

export async function sendMessage(
  applicationId: number,
  senderRole: "candidate" | "company",
  body: string,
  attachment: { url: string; name: string } | null = null
) {
  await sql`
    INSERT INTO messages (application_id, sender_role, body, attachment_url, attachment_name)
    VALUES (${applicationId}, ${senderRole}, ${body}, ${attachment?.url ?? null}, ${attachment?.name ?? null})
  `;
  await sql`UPDATE applications SET updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = ${applicationId}`;
}

export async function markMessagesRead(applicationId: number, readerRole: "candidate" | "company") {
  // Mark the OTHER party's messages as read, since the reader is the recipient.
  const senderRole = readerRole === "candidate" ? "company" : "candidate";
  await sql`
    UPDATE messages SET read_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE application_id = ${applicationId} AND sender_role = ${senderRole} AND read_at IS NULL
  `;
}

export async function editMessage(messageId: number, senderRole: "candidate" | "company", newBody: string) {
  // Only the original sender can edit their own message.
  await sql`
    UPDATE messages SET body = ${newBody}, edited_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE id = ${messageId} AND sender_role = ${senderRole}
  `;
}

export async function deleteMessage(messageId: number, senderRole: "candidate" | "company") {
  // Soft delete — keeps the row (and its place in the conversation) but
  // clears the content, same convention most chat apps use.
  await sql`
    UPDATE messages SET body = '', attachment_url = NULL, attachment_name = NULL,
      deleted_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    WHERE id = ${messageId} AND sender_role = ${senderRole}
  `;
}

export async function toggleReaction(messageId: number, senderRole: "candidate" | "company", emoji: string) {
  const rows = (await sql`
    SELECT emoji FROM message_reactions WHERE message_id = ${messageId} AND sender_role = ${senderRole}
  `) as { emoji: string }[];
  const existing = rows[0];
  if (existing && existing.emoji === emoji) {
    // Clicking the same reaction again removes it.
    await sql`DELETE FROM message_reactions WHERE message_id = ${messageId} AND sender_role = ${senderRole}`;
  } else if (existing) {
    await sql`UPDATE message_reactions SET emoji = ${emoji} WHERE message_id = ${messageId} AND sender_role = ${senderRole}`;
  } else {
    await sql`INSERT INTO message_reactions (message_id, sender_role, emoji) VALUES (${messageId}, ${senderRole}, ${emoji})`;
  }
}

export async function listReactionsForApplication(applicationId: number) {
  return (await sql`
    SELECT message_reactions.* FROM message_reactions
    JOIN messages ON messages.id = message_reactions.message_id
    WHERE messages.application_id = ${applicationId}
  `) as { id: number; message_id: number; sender_role: "candidate" | "company"; emoji: string }[];
}

// ---------- Certifications ----------
export type Certification = {
  id: number;
  user_id: number;
  name: string;
  provider: string;
  link_url: string | null;
  file_url: string | null;
  created_at: string;
};

export async function listCertifications(userId: number): Promise<Certification[]> {
  return (await sql`
    SELECT * FROM candidate_certifications WHERE user_id = ${userId} ORDER BY created_at DESC
  `) as Certification[];
}

export async function addCertification(
  userId: number,
  name: string,
  provider: string,
  linkUrl: string | null,
  fileUrl: string | null
) {
  await sql`
    INSERT INTO candidate_certifications (user_id, name, provider, link_url, file_url)
    VALUES (${userId}, ${name}, ${provider}, ${linkUrl}, ${fileUrl})
  `;
}

export async function deleteCertification(id: number, userId: number) {
  await sql`DELETE FROM candidate_certifications WHERE id = ${id} AND user_id = ${userId}`;
}

// ---------- Education ----------
export type Education = {
  id: number;
  user_id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  created_at: string;
};

export const DEGREE_OPTIONS = ["High School", "Associate's", "Bachelor's", "Master's", "PhD", "Other"];

export async function listEducation(userId: number): Promise<Education[]> {
  return (await sql`
    SELECT * FROM candidate_education WHERE user_id = ${userId} ORDER BY created_at DESC
  `) as Education[];
}

export async function addEducation(userId: number, institution: string, degree: string, fieldOfStudy: string) {
  await sql`
    INSERT INTO candidate_education (user_id, institution, degree, field_of_study)
    VALUES (${userId}, ${institution}, ${degree}, ${fieldOfStudy})
  `;
}

export async function deleteEducation(id: number, userId: number) {
  await sql`DELETE FROM candidate_education WHERE id = ${id} AND user_id = ${userId}`;
}

// ---------- Company social links ----------
export type SocialLink = { id: number; user_id: number; platform: string; url: string };

export const SOCIAL_PLATFORMS = ["LinkedIn", "Facebook", "Instagram", "X (Twitter)", "YouTube", "TikTok", "Other"];

export async function listSocialLinks(userId: number): Promise<SocialLink[]> {
  return (await sql`SELECT * FROM company_social_links WHERE user_id = ${userId} ORDER BY id ASC`) as SocialLink[];
}

export async function addSocialLink(userId: number, platform: string, url: string) {
  await sql`INSERT INTO company_social_links (user_id, platform, url) VALUES (${userId}, ${platform}, ${url})`;
}

export async function deleteSocialLink(id: number, userId: number) {
  await sql`DELETE FROM company_social_links WHERE id = ${id} AND user_id = ${userId}`;
}

// ---------- Candidate pool (for companies) ----------
export type CandidateFilters = {
  position?: string;
  location?: string;
  minExperience?: string;
  skills?: string;
  salaryMin?: string;
  salaryMax?: string;
};

export async function listActiveCandidatePool(filters: CandidateFilters = {}) {
  const rows = (await sql`
    SELECT * FROM candidate_profiles WHERE actively_looking = 1 AND onboarded = 1 ORDER BY user_id DESC
  `) as CandidateProfile[];

  return rows.filter((c) => {
    if (filters.position) {
      const wanted = filters.position.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (wanted.length && !wanted.some((w) => c.title.toLowerCase().includes(w))) return false;
    }
    if (filters.location && c.location !== filters.location) return false;
    if (filters.minExperience && c.years_experience < Number(filters.minExperience)) return false;
    if (filters.skills) {
      const wanted = filters.skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const has = parseSkills(c.skills).map((s) => s.toLowerCase());
      if (!wanted.every((w) => has.some((h) => h.includes(w)))) return false;
    }
    if (filters.salaryMin && c.salary_max < Number(filters.salaryMin)) return false;
    if (filters.salaryMax && c.salary_min > Number(filters.salaryMax)) return false;
    return true;
  });
}

export async function touchLastSeen(userId: number) {
  await sql`UPDATE users SET last_seen_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = ${userId}`;
}

// ---------- Contact ----------
export async function saveContactMessage(email: string, body: string, topic: string = "", attachmentUrl: string | null = null) {
  await sql`INSERT INTO contact_messages (email, body, topic, attachment_url) VALUES (${email}, ${body}, ${topic}, ${attachmentUrl})`;
}

// ---------- Work experience ----------
export type Experience = {
  id: number;
  user_id: number;
  company: string;
  title: string;
  start_year: number;
  end_year: number | null;
  created_at: string;
};

export async function listExperiences(userId: number): Promise<Experience[]> {
  return (await sql`
    SELECT * FROM candidate_experiences WHERE user_id = ${userId}
    ORDER BY (end_year IS NULL) DESC, COALESCE(end_year, 9999) DESC, start_year DESC
  `) as Experience[];
}

export async function addExperience(
  userId: number,
  company: string,
  title: string,
  startYear: number,
  endYear: number | null
): Promise<{ ok: boolean; error?: string }> {
  if (endYear !== null && endYear < startYear) {
    return { ok: false, error: "End year can't be before the start year." };
  }
  await sql`
    INSERT INTO candidate_experiences (user_id, company, title, start_year, end_year)
    VALUES (${userId}, ${company}, ${title}, ${startYear}, ${endYear})
  `;
  return { ok: true };
}

export async function deleteExperience(id: number, userId: number) {
  await sql`DELETE FROM candidate_experiences WHERE id = ${id} AND user_id = ${userId}`;
}

// ---------- Email verification ----------
export async function createEmailVerification(userId: number): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO email_verifications (user_id, token, expires_at) VALUES (${userId}, ${token}, ${expiresAt})
  `;
  return token;
}

export async function verifyEmailToken(token: string): Promise<{ ok: boolean; userId?: number }> {
  const rows = (await sql`
    SELECT * FROM email_verifications WHERE token = ${token} AND used = 0
  `) as { id: number; user_id: number; expires_at: string }[];
  const row = rows[0];
  if (!row) return { ok: false };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false };

  await sql`UPDATE email_verifications SET used = 1 WHERE id = ${row.id}`;
  await sql`UPDATE users SET email_verified = 1 WHERE id = ${row.user_id}`;
  return { ok: true, userId: row.user_id };
}

export async function isEmailVerified(userId: number): Promise<boolean> {
  const rows = (await sql`SELECT email_verified FROM users WHERE id = ${userId}`) as { email_verified: number }[];
  return !!rows[0]?.email_verified;
}

// ---------- Password reset (emailed OTP) ----------
export async function createPasswordResetOtp(userId: number): Promise<string> {
  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO password_resets (user_id, otp_code, expires_at) VALUES (${userId}, ${otp}, ${expiresAt})
  `;
  return otp;
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string
): Promise<{ ok: boolean; userId?: number }> {
  const userRows = (await sql`SELECT id FROM users WHERE email = ${email}`) as { id: number }[];
  const user = userRows[0];
  if (!user) return { ok: false };

  const rows = (await sql`
    SELECT * FROM password_resets
    WHERE user_id = ${user.id} AND otp_code = ${otp} AND used = 0
    ORDER BY created_at DESC LIMIT 1
  `) as { id: number; expires_at: string }[];
  const row = rows[0];
  if (!row) return { ok: false };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false };

  await sql`UPDATE password_resets SET used = 1 WHERE id = ${row.id}`;
  return { ok: true, userId: user.id };
}

// ---------- Incomplete-profile reminders ----------
export async function findIncompleteSignupsNeedingReminder(): Promise<
  { id: number; email: string; role: "candidate" | "company" }[]
> {
  const candidateRows = (await sql`
    SELECT users.id, users.email, users.role FROM users
    JOIN candidate_profiles ON candidate_profiles.user_id = users.id
    WHERE users.role = 'candidate' AND users.reminder_sent = 0 AND candidate_profiles.onboarded = 0
      AND users.created_at::timestamp < (now() - interval '2 hours')
  `) as { id: number; email: string; role: "candidate" | "company" }[];

  const companyRows = (await sql`
    SELECT users.id, users.email, users.role FROM users
    JOIN company_profiles ON company_profiles.user_id = users.id
    WHERE users.role = 'company' AND users.reminder_sent = 0 AND company_profiles.onboarded = 0
      AND users.created_at::timestamp < (now() - interval '2 hours')
  `) as { id: number; email: string; role: "candidate" | "company" }[];

  return [...candidateRows, ...companyRows];
}

export async function markReminderSent(userId: number) {
  await sql`UPDATE users SET reminder_sent = 1 WHERE id = ${userId}`;
}

// ---------- Unread conversation counts (for nav badges) ----------
// Counts DISTINCT conversations with at least one unread message, not the
// total number of unread messages — matching Instagram-style DM badges,
// per the founder's feedback: multiple unread messages from the same
// person still count as one.
export async function countUnreadConversationsForCandidate(candidateUserId: number): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) as n FROM applications
    WHERE candidate_user_id = ${candidateUserId}
    AND EXISTS (
      SELECT 1 FROM messages m
      WHERE m.application_id = applications.id
      AND m.sender_role = 'company' AND m.read_at IS NULL
    )
  `;
  return Number(rows[0].n);
}

export async function countUnreadConversationsForCompany(companyUserId: number): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) as n FROM applications
    JOIN jobs ON jobs.id = applications.job_id
    WHERE jobs.company_user_id = ${companyUserId}
    AND EXISTS (
      SELECT 1 FROM messages m
      WHERE m.application_id = applications.id
      AND m.sender_role = 'candidate' AND m.read_at IS NULL
    )
  `;
  return Number(rows[0].n);
}
