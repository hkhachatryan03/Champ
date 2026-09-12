"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useRef, useState } from "react";

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
        class: "prose-sm max-w-none outline-none px-3 py-2 text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1",
      },
    },
    onCreate: ({ editor }) => syncState(editor),
    onUpdate: ({ editor }) => {
      if (hiddenRef.current) hiddenRef.current.value = editor.isEmpty ? "" : editor.getHTML();
      syncState(editor);
    },
    onSelectionUpdate: ({ editor }) => syncState(editor),
  });

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
        <span className="w-px h-4 bg-line mx-1" />
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
          <p className="absolute top-2 left-3 text-sm text-muted pointer-events-none">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
      {/* The actual form field our server actions read via formData.get(name). */}
      <input type="hidden" ref={hiddenRef} name={name} required={required} defaultValue={defaultValue || ""} />
    </div>
  );
}
