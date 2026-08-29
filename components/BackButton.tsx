"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallbackHref, label = "← Back" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        // If there's real browser history to go back to, use it — this is
        // what actually fixes "back always goes to the wrong page,"
        // since a hardcoded destination can't know where the user came
        // from (Candidates hub, a job's applicant list, or a chat thread
        // all lead here). Fall back to a sensible default only if this
        // page was opened directly (e.g. a bookmark or shared link).
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="text-sm text-muted"
    >
      {label}
    </button>
  );
}
