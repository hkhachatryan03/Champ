export type LockReason = "paused" | "archived" | "not_moving_forward" | null;

export function getJobLockReason(job: { active: number; archived_at: string | null }): LockReason {
  if (job.archived_at) return "archived";
  if (!job.active) return "paused";
  return null;
}

export function getThreadLockReason(
  job: { active: number; archived_at: string | null },
  applicationStatus: string
): LockReason {
  const jobReason = getJobLockReason(job);
  if (jobReason) return jobReason;
  if (applicationStatus === "Not moving forward") return "not_moving_forward";
  return null;
}

export const LOCK_BANNER_TEXT: Record<Exclude<LockReason, null>, { title: string; body: string }> = {
  paused: {
    title: "This role is currently paused",
    body: "The company has temporarily paused this role. Nothing here is deleted — you can still see everything, but new messages can't be sent right now.",
  },
  archived: {
    title: "This role has been archived",
    body: "This role is no longer active and has been archived by the company. Nothing here is deleted — you can still see everything, but new messages can't be sent.",
  },
  not_moving_forward: {
    title: "This conversation has been closed",
    body: "The company has moved forward without this application. Nothing here is deleted, but new messages can't be sent in this conversation.",
  },
};
