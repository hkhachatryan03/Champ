"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, Paperclip, Send, X } from "lucide-react";

export default function MessageComposer({
  applicationId,
  action,
}: {
  applicationId: number;
  action: (prevState: number, formData: FormData) => Promise<number>;
}) {
  const [sentCount, formAction, isPending] = useActionState(action, 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Reset the composer only once the server actually confirms the send —
  // this is a hard DOM reset via ref, not a React-controlled value, so
  // there's no race between "did the browser submit the old text" and
  // "did we clear it in time." It just can't go stale.
  useEffect(() => {
    if (sentCount === 0) return;
    if (textareaRef.current) textareaRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileName(null);
    textareaRef.current?.focus();
  }, [sentCount]);

  const wrapSelection = (before: string, after: string = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value;
    const selected = value.slice(start, end);
    el.value = value.slice(0, start) + before + selected + after + value.slice(end);
    el.focus();
    el.selectionStart = start + before.length;
    el.selectionEnd = start + before.length + selected.length;
  };

  const insertLinePrefix = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const value = el.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    el.value = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    el.focus();
    el.selectionStart = el.selectionEnd = start + prefix.length;
  };

  // Pressing Enter on a list line continues the same list on the next
  // line, instead of requiring the toolbar button to be clicked again for
  // every item.
  const handleListContinuation = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const value = el.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", start);
    const currentLine = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);

    const bulletMatch = currentLine.match(/^(-\s+)(.*)/);
    const numberedMatch = currentLine.match(/^(\d+)\.\s+(.*)/);
    if (!bulletMatch && !numberedMatch) return; // let Enter submit normally otherwise

    e.preventDefault();
    if (bulletMatch) {
      if (!bulletMatch[2].trim()) {
        el.value = value.slice(0, lineStart) + value.slice(start);
        el.selectionStart = el.selectionEnd = lineStart;
      } else {
        const insertion = "\n- ";
        el.value = value.slice(0, start) + insertion + value.slice(start);
        el.selectionStart = el.selectionEnd = start + insertion.length;
      }
    } else if (numberedMatch) {
      if (!numberedMatch[2].trim()) {
        el.value = value.slice(0, lineStart) + value.slice(start);
        el.selectionStart = el.selectionEnd = lineStart;
      } else {
        const nextNum = Number(numberedMatch[1]) + 1;
        const insertion = `\n${nextNum}. `;
        el.value = value.slice(0, start) + insertion + value.slice(start);
        el.selectionStart = el.selectionEnd = start + insertion.length;
      }
    }
  };

  const toolBtn =
    "w-7 h-7 rounded-md text-muted flex items-center justify-center hover:bg-white hover:text-ink hover:shadow-sm transition-all";

  return (
    <form action={formAction} encType="multipart/form-data" className="mt-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="rounded-xl border border-line bg-white overflow-hidden focus-within:border-apricot/50 transition-colors">
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-paper-dim/60 border-b border-line">
          <button type="button" onClick={() => wrapSelection("**")} className={toolBtn} title="Bold">
            <Bold size={14} />
          </button>
          <button type="button" onClick={() => wrapSelection("*")} className={toolBtn} title="Italic">
            <Italic size={14} />
          </button>
          <span className="w-px h-4 bg-line mx-1" />
          <button type="button" onClick={() => insertLinePrefix("- ")} className={toolBtn} title="Bullet list">
            <List size={14} />
          </button>
          <button type="button" onClick={() => insertLinePrefix("1. ")} className={toolBtn} title="Numbered list">
            <ListOrdered size={14} />
          </button>
          <span className="w-px h-4 bg-line mx-1" />
          <label className={`${toolBtn} cursor-pointer`} title="Attach a file">
            <Paperclip size={14} />
            <input
              ref={fileInputRef}
              type="file"
              name="attachment"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
            />
          </label>
          {fileName && (
            <span className="text-xs text-muted flex items-center gap-1 bg-white border border-line px-2 py-1 rounded-full ml-1">
              {fileName}
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setFileName(null);
                }}
                className="hover:text-apricot-deep"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>
        <div className="flex items-end gap-2 px-3 py-2">
          <textarea
            ref={textareaRef}
            name="body"
            defaultValue=""
            placeholder="Write a message…"
            rows={2}
            onKeyDown={handleListContinuation}
            className="flex-1 text-sm outline-none resize-none bg-transparent"
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-9 h-9 rounded-full bg-apricot text-ink flex items-center justify-center disabled:opacity-60 flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}
