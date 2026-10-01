"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({
  fallbackHref,
  label = "← Back",
  glass = false,
}: {
  fallbackHref: string;
  label?: string;
  /** Dark "Ethereal Glass" look. Default = original plain button. */
  glass?: boolean;
}) {
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
      className={glass ? "aur-backbtn" : "text-sm text-muted"}
    >
      {glass ? (
        <>
          <ArrowLeft size={16} strokeWidth={1.25} /> Back
        </>
      ) : (
        label
      )}
    </button>
  );
}
