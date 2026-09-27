function LinkedInMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

export default function LinkedInButton({
  mode,
  role,
  recruiterType,
}: {
  mode: "login" | "signup";
  role?: "candidate" | "company";
  recruiterType?: "company" | "agency";
}) {
  const params = new URLSearchParams({
    mode,
    ...(role ? { role } : {}),
    ...(recruiterType ? { recruiterType } : {}),
  });
  return (
    <a
      href={`/api/auth/linkedin/start?${params.toString()}`}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-line bg-white text-sm font-medium text-ink hover:border-ink/30 hover:shadow-sm transition-all"
    >
      <LinkedInMark />
      {mode === "signup" ? "Sign up with LinkedIn" : "Continue with LinkedIn"}
    </a>
  );
}
