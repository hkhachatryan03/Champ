// Formats how long ago something was posted, as "Xd" for under a month,
// then switching to "Xm" (months) past 30 days — e.g. "22d", "1m", "2m".
export function formatPostedAge(dateStr: string): string {
  const posted = new Date(dateStr.replace(" ", "T"));
  if (isNaN(posted.getTime())) return dateStr;

  const diffMs = Date.now() - posted.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays < 1) return "Today";
  if (diffDays < 30) return `${diffDays}d`;
  const months = Math.floor(diffDays / 30);
  return `${months}m`;
}
