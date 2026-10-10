"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

// Copies the PUBLIC address of a role (/jobs/123).
//
// People tend to copy whatever is in the browser's address bar — but that is a
// private page (login required) and shows no preview when shared. The public
// address is the one that previews properly on LinkedIn, Facebook and
// messengers, so this button always hands out that one.
export default function CopyLinkButton({
  path,
  variant = "button",
}: {
  path: string;
  variant?: "button" | "text";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = new URL(path, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Some browsers/contexts block clipboard access — fall back to a prompt
      // the person can copy from by hand.
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const classes =
    variant === "button"
      ? "aur-btn border border-paper/15 bg-paper/[.04] text-paper !text-[13.5px] !py-[11px] hover:border-apricot hover:text-apricot whitespace-nowrap"
      : "inline-flex items-center gap-1.5 text-[12.5px] text-paper/55 hover:text-apricot mt-2.5 transition-colors";

  return (
    <button
      type="button"
      onClick={copy}
      className={classes}
      title="Copies the public link — it shows a preview when shared on LinkedIn or Facebook"
    >
      {copied ? <Check size={14} /> : <Link2 size={14} />}
      <span aria-live="polite">{copied ? "Link copied" : variant === "button" ? "Copy public link" : "Copy link"}</span>
    </button>
  );
}
