"use client";

import { useRef } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

export default function RichTextarea({
  name,
  defaultValue,
  placeholder,
  required,
  rows = 4,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  // line, the way Word/Notion/Google Docs do — without this, the bullet
  // button only ever adds a prefix to the CURRENT line, so continuing a
  // list means clicking the toolbar button again for every single item.
  const handleListContinuation = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const value = el.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", start);
    const currentLine = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);

    const bulletMatch = currentLine.match(/^(-\s+)(.*)/);
    const numberedMatch = currentLine.match(/^(\d+)\.\s+(.*)/);

    if (bulletMatch) {
      e.preventDefault();
      if (!bulletMatch[2].trim()) {
        // Empty bullet line — pressing Enter again exits the list instead
        // of adding another empty bullet forever.
        el.value = value.slice(0, lineStart) + value.slice(start);
        el.selectionStart = el.selectionEnd = lineStart;
      } else {
        const insertion = "\n- ";
        el.value = value.slice(0, start) + insertion + value.slice(start);
        el.selectionStart = el.selectionEnd = start + insertion.length;
      }
    } else if (numberedMatch) {
      e.preventDefault();
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
      </div>
      <textarea
        ref={textareaRef}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        rows={rows}
        onKeyDown={handleListContinuation}
        className="w-full px-3 py-2 text-sm outline-none resize-none"
      />
    </div>
  );
}
