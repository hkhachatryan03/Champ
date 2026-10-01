"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function RichEditor({
  name,
  defaultValue,
  placeholder,
  required,
  minHeight = 90,
  glass = false,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  minHeight?: number;
  /** Dark "Ethereal Glass" look. Default = original light editor. */
  glass?: boolean;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [isEmpty, setIsEmpty] = useState(!defaultValue);
  const [activeMarks, setActiveMarks] = useState({ bold: false, italic: false, bulletList: false, orderedList: false });

  const syncState = (editorInstance: NonNullable<ReturnType<typeof useEditor>>) => {
    setIsEmpty(editorInstance.isEmpty);
    setActiveMarks({
      bold: editorInstance.isActive("bold"),
      italic: editorInstance.isActive("italic"),
      bulletList: editorInstance.isActive("bulletList"),
      orderedList: editorInstance.isActive("orderedList"),
    });
  };

  const editor = useEditor({
    // Next.js renders this on the server first for the initial HTML;
    // without this flag, Tiptap tries to render real editor content
    // during that pass and Next complains about a hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Keep the schema to exactly what we render elsewhere (chat,
        // descriptions, "about" sections) — no headings, code blocks,
        // blockquotes, etc. that we have no matching display for.
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
    ],
    content: defaultValue || "",
    editorProps: {
      attributes: {
        class: `prose-sm max-w-none outline-none px-3 py-2 text-sm ${glass ? "text-paper " : ""}[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1`,
      },
    },
    onCreate: ({ editor }) => syncState(editor),
    onUpdate: ({ editor }) => {
      if (hiddenRef.current) hiddenRef.current.value = editor.isEmpty ? "" : editor.getHTML();
      syncState(editor);
    },
    onSelectionUpdate: ({ editor }) => syncState(editor),
  });

  // Defense in depth: whatever the exact cause of a stale value might be
  // (a missed update event, a race between typing and clicking Save),
  // this re-reads directly from the live editor instance the moment the
  // surrounding form actually submits — so submission can never carry a
  // value older than what's genuinely on screen right now.
  useEffect(() => {
    const hidden = hiddenRef.current;
    const form = hidden?.form;
    if (!form || !editor) return;
    const handleSubmit = () => {
      hidden.value = editor.isEmpty ? "" : editor.getHTML();
    };
    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [editor]);

  const toolBtn = (active: boolean) =>
    glass
      ? `w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
          active ? "bg-apricot/20 text-apricot" : "text-paper/60 hover:bg-paper/10 hover:text-paper"
        }`
      : `w-7 h-7 rounded-md flex items-center justify-center transition-all ${
          active ? "bg-ink text-paper" : "text-muted hover:bg-white hover:text-ink hover:shadow-sm"
        }`;

  return (
    <div
      className={
        glass
          ? "rounded-xl border border-paper/15 bg-ink/55 overflow-hidden focus-within:border-apricot focus-within:shadow-[0_0_0_3px_rgba(234,154,46,.18)] transition-[border-color,box-shadow]"
          : "rounded-xl border border-line bg-white overflow-hidden focus-within:border-apricot/50 transition-colors"
      }
    >
      <div className={`flex items-center gap-0.5 px-2 py-1.5 ${glass ? "bg-paper/[.03] border-b border-paper/10" : "bg-paper-dim/60 border-b border-line"}`}>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={toolBtn(activeMarks.bold)}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={toolBtn(activeMarks.italic)}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <span className={`w-px h-4 mx-1 ${glass ? "bg-paper/15" : "bg-line"}`} />
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={toolBtn(activeMarks.bulletList)}
          title="Bullet list"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={toolBtn(activeMarks.orderedList)}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </button>
      </div>
      <div className="relative" style={{ minHeight }}>
        {isEmpty && placeholder && (
          <p className={`absolute top-2 left-3 text-sm pointer-events-none ${glass ? "text-paper/30" : "text-muted"}`}>{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
      {/* The actual form field our server actions read via formData.get(name). */}
      <input type="hidden" ref={hiddenRef} name={name} required={required} defaultValue={defaultValue || ""} />
    </div>
  );
}
