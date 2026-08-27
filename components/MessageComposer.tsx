"use client";

import { useRef, useState } from "react";

export default function MessageComposer({
  applicationId,
  action,
}: {
  applicationId: number;
  action: (formData: FormData) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const wrapSelection = (before: string, after: string = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const newValue = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = body.lastIndexOf("\n", start - 1) + 1;
    const newValue = body.slice(0, lineStart) + prefix + body.slice(lineStart);
    setBody(newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + prefix.length;
    });
  };

  return (
    <form action={action} encType="multipart/form-data" className="mt-4 flex flex-col gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => wrapSelection("**")} className="w-7 h-7 rounded text-sm font-bold hover:bg-paper-dim" title="Bold">
          B
        </button>
        <button type="button" onClick={() => wrapSelection("*")} className="w-7 h-7 rounded text-sm italic hover:bg-paper-dim" title="Italic">
          I
        </button>
        <button type="button" onClick={() => insertLinePrefix("- ")} className="w-7 h-7 rounded text-sm hover:bg-paper-dim" title="Bullet list">
          •
        </button>
        <button type="button" onClick={() => insertLinePrefix("1. ")} className="w-7 h-7 rounded text-sm hover:bg-paper-dim" title="Numbered list">
          1.
        </button>
        <label className="w-7 h-7 rounded text-sm hover:bg-paper-dim flex items-center justify-center cursor-pointer" title="Attach a file">
          📎
          <input
            ref={fileInputRef}
            type="file"
            name="attachment"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
          />
        </label>
        {fileName && (
          <span className="text-xs text-muted flex items-center gap-1">
            {fileName}
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = "";
                setFileName(null);
              }}
              className="hover:text-apricot-deep"
            >
              ✕
            </button>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <textarea
          ref={textareaRef}
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none resize-none"
        />
        <button type="submit" className="px-4 py-2.5 rounded-lg bg-apricot text-ink text-sm font-medium self-end">
          Send
        </button>
      </div>
    </form>
  );
}
