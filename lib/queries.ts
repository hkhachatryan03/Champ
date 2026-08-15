import sql from "./db";

export type CandidateProfile = {
  user_id: number;
  name: string;
  title: string;
  years_experience: number;
  skills: string; // JSON array string
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
  industry: string;
  size: string;
  website: string;
  about: string;
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
  created_at: string;
};

export type Application = {
  id: number;
  job_id: number;
  candidate_user_id: number;
  cover_note: string;
  cv_filename: string | null;
  expected_salary: number | null;
  status: "New" | "Interviewing" | "Offer" | "Not moving forward";
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  application_id: number;
  sender_role: "candidate" | "company";
  body: string;
  read_at: string | null;
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
      skills = ${m.skills}, salary_min = ${m.salary_min}, salary_max = ${m.salary_max},
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
      name = ${m.name}, industry = ${m.industry}, size = ${m.size},
      website = ${m.website}, about = ${m.about}, verified = ${m.verified}, onboarded = ${m.onboarded}
    WHERE user_id = ${userId}
  `;
}

// ---------- Jobs ----------
export type JobFilters = {
  position?: string;
  company?: string;
  category?: string;
  employmentType?: string;
  remote?: string; // "remote" | "onsite" | ""
  location?: string;
  salaryMin?: string;
  salaryMax?: string;
};

export async function listActiveJobsWithCompany(filters: JobFilters = {}) {
  const rows = (await sql`
    SELECT jobs.*, company_profiles.name as company_name, company_profiles.verified as company_verified
    FROM jobs
    JOIN company_profiles ON company_profiles.user_id = jobs.company_user_id
    WHERE jobs.active = 1
    ORDER BY jobs.created_at DESC
  `) as (Job & { company_name: string; company_verified: number })[];

  return rows.filter((j) => {
    if (filters.position && !j.title.toLowerCase().includes(filters.position.toLowerCase())) return false;
    if (filters.company && !j.company_name.toLowerCase().includes(filters.company.toLowerCase())) return false;
    if (filters.category && j.category !== filters.category) return false;
    if (filters.employmentType && j.employment_type !== filters.employmentType) return false;
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

export async function listJobsForCompany(companyUserId: number) {
  return (await sql`
    SELECT * FROM jobs WHERE company_user_id = ${companyUserId} ORDER BY created_at DESC
  `) as Job[];
}

export async function createJob(
  companyUserId: number,
  data: Omit<Job, "id" | "company_user_id" | "active" | "created_at">
) {
  const rows = await sql`
    INSERT INTO jobs
      (company_user_id, title, category, employment_type, location, remote, salary_min, salary_max, skills, description)
    VALUES (${companyUserId}, ${data.title}, ${data.category}, ${data.employment_type}, ${data.location},
            ${data.remote}, ${data.salary_min}, ${data.salary_max}, ${data.skills}, ${data.description})
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
      skills=${m.skills}, description=${m.description}, active=${m.active}
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
    SELECT id FROM applications WHERE job_id = ${jobId} AND candidate_user_id = ${candidateUserId}
  `) as { id: number }[];
  return rows[0] as { id: number } | undefined;
}

// ---------- Applications ----------
export async function createApplication(
  jobId: number,
  candidateUserId: number,
  coverNote: string,
  cvFilename: string | null,
  expectedSalary: number | null
) {
  const rows = await sql`
    INSERT INTO applications (job_id, candidate_user_id, cover_note, cv_filename, expected_salary)
    VALUES (${jobId}, ${candidateUserId}, ${coverNote}, ${cvFilename}, ${expectedSalary})
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function listApplicationsForCandidate(candidateUserId: number) {
  return (await sql`
    SELECT applications.*, jobs.title as job_title, company_profiles.name as company_name,
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
      company_profiles.name as company_name, candidate_profiles.name as candidate_name
    FROM applications
    JOIN jobs ON jobs.id = applications.job_id
    JOIN company_profiles ON company_profiles.user_id = jobs.company_user_id
    JOIN candidate_profiles ON candidate_profiles.user_id = applications.candidate_user_id
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

// ---------- Messages ----------
export async function listMessages(applicationId: number) {
  return (await sql`
    SELECT * FROM messages WHERE application_id = ${applicationId} ORDER BY created_at ASC
  `) as Message[];
}

export async function sendMessage(applicationId: number, senderRole: "candidate" | "company", body: string) {
  await sql`INSERT INTO messages (application_id, sender_role, body) VALUES (${applicationId}, ${senderRole}, ${body})`;
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

// ---------- Candidate pool (for companies) ----------
export async function listActiveCandidatePool() {
  return (await sql`
    SELECT * FROM candidate_profiles WHERE actively_looking = 1 AND onboarded = 1 ORDER BY user_id DESC
  `) as CandidateProfile[];
}

// ---------- Contact ----------
export async function saveContactMessage(email: string, body: string) {
  await sql`INSERT INTO contact_messages (email, body) VALUES (${email}, ${body})`;
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
    ORDER BY (end_year IS NULL) DESC, start_year ASC
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
