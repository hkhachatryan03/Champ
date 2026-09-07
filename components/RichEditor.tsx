"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect } from "react";

export default function RichEditor({
  name,
  defaultValue,
  placeholder,
  required,
  minHeight = 90,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  minHeight?: number;
}) {
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
        class: "prose-sm max-w-none outline-none px-3 py-2 text-sm",
      },
    },
  });

  // Keep a hidden native input in sync with the editor's HTML, since our
  // forms are plain <form action={serverAction}> submissions reading
  // FormData — the editor itself isn't a form field.
  useEffect(() => {
    if (!editor) return;
    const hidden = document.getElementById(`rich-${name}`) as HTMLInputElement | null;
    const sync = () => {
      if (hidden) hidden.value = editor.isEmpty ? "" : editor.getHTML();
    };
    sync();
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor, name]);

  const isEmpty = editor?.isEmpty ?? !defaultValue;

  const toolBtn = (active: boolean) =>
    `w-7 h-7 rounded-md flex items-center justify-center transition-all ${
      active ? "bg-ink text-paper" : "text-muted hover:bg-white hover:text-ink hover:shadow-sm"
    }`;

  return (
    <div className="rounded-xl border border-line bg-white overflow-hidden focus-within:border-apricot/50 transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-paper-dim/60 border-b border-line">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={toolBtn(!!editor?.isActive("bold"))}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={toolBtn(!!editor?.isActive("italic"))}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <span className="w-px h-4 bg-line mx-1" />
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={toolBtn(!!editor?.isActive("bulletList"))}
          title="Bullet list"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={toolBtn(!!editor?.isActive("orderedList"))}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </button>
      </div>
      <div className="relative" style={{ minHeight }}>
        {isEmpty && placeholder && (
          <p className="absolute top-2 left-3 text-sm text-muted pointer-events-none">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
      {/* The actual form field our server actions read via formData.get(name). */}
      <input type="hidden" id={`rich-${name}`} name={name} required={required} defaultValue={defaultValue || ""} />
    </div>
  );
}
