"use client";

import { useEffect, useRef, useState } from "react";

export default function UnsavedChangesGuard({ formId, glass = false }: { formId: string; glass?: boolean }) {
  const [isDirty, setIsDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const initialSnapshot = useRef<string | null>(null);

  // Detect changes by snapshotting every field's value on mount, then
  // comparing against it — including hidden fields, since that's how our
  // rich text editor mirrors its content into the form.
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const getSnapshot = () => {
      const elements = form.querySelectorAll("input:not([type=file]), select, textarea");
      return Array.from(elements)
        .map((el) => {
          const element = el as HTMLInputElement;
          if (element.type === "checkbox" || element.type === "radio") return `${element.name}:${element.checked}`;
          return `${element.name}:${element.value}`;
        })
        .join("|");
    };

    initialSnapshot.current = getSnapshot();
    const checkDirty = () => {
      const dirty = getSnapshot() !== initialSnapshot.current;
      setIsDirty(dirty);
      // Lets the glass save bar (pure CSS) switch between "All changes saved"
      // and "You have unsaved changes". No effect on pages that don't style it.
      if (dirty) form.setAttribute("data-dirty", "");
      else form.removeAttribute("data-dirty");
    };

    form.addEventListener("input", checkDirty);
    form.addEventListener("change", checkDirty);
    // The rich text editor sets its hidden field's value directly via JS
    // (not user typing), which doesn't fire a native 'input' event on
    // that field — a light poll catches that case too.
    const interval = setInterval(checkDirty, 500);

    return () => {
      form.removeEventListener("input", checkDirty);
      form.removeEventListener("change", checkDirty);
      clearInterval(interval);
    };
  }, [formId]);

  // Covers closing the tab, refreshing, or typing a new URL — the
  // browser's own native mechanism, can't be custom-styled, but it's
  // genuinely reliable.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Covers clicking one of our own links to another page — intercepted
  // in the capture phase, which runs before Next's own Link click
  // handler, so calling preventDefault() here genuinely stops the
  // client-side navigation from happening underneath our dialog.
  useEffect(() => {
    if (!isDirty) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || anchor.target === "_blank") return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty]);

  if (!pendingHref) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 ${glass ? "z-[90] bg-ink/75 backdrop-blur-sm" : "z-50 bg-ink/60"}`}>
      <div className={glass ? "aur-bezel w-full max-w-sm" : "bg-white rounded-xl p-5 max-w-sm w-full"}>
       <div className={glass ? "aur-bezel-inner p-5" : undefined}>
        <p className={`text-sm font-medium mb-2 ${glass ? "text-paper" : ""}`}>You have unsaved changes</p>
        <p className={`text-sm mb-4 ${glass ? "text-paper/60" : "text-muted"}`}>
          Leaving this page means everything you changed will be lost — you&apos;ll need to start over if you come back.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPendingHref(null)}
            className={glass ? "flex-1 px-4 py-2 rounded-full text-sm font-medium bg-apricot text-ink" : "flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-ink text-paper"}
          >
            Stay & keep editing
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = pendingHref;
            }}
            className={glass ? "flex-1 px-4 py-2 rounded-full text-sm font-medium border border-paper/20 text-paper" : "flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-line"}
          >
            Leave without saving
          </button>
        </div>
       </div>
      </div>
    </div>
  );
}
