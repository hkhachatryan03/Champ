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

// Formats a last-seen timestamp as "Online now" (within 2 minutes), then
// minutes, hours, days, and finally months — e.g. "5m ago", "2h ago",
// "3d ago", "1mo ago".
export function formatLastActive(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "Never active";
  const seen = new Date(lastSeenAt.replace(" ", "T"));
  if (isNaN(seen.getTime())) return "Never active";

  const diffMs = Math.max(0, Date.now() - seen.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 2) return "Online now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}
