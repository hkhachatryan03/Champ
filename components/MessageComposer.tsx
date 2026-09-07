"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Paperclip, Send, X } from "lucide-react";

export default function MessageComposer({
  applicationId,
  action,
}: {
  applicationId: number;
  action: (prevState: number, formData: FormData) => Promise<number>;
}) {
  const [sentCount, formAction, isPending] = useActionState(action, 0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenBodyRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
    ],
    content: "",
    editorProps: {
      attributes: { class: "prose-sm max-w-none outline-none text-sm" },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      if (hiddenBodyRef.current) hiddenBodyRef.current.value = editor.isEmpty ? "" : editor.getHTML();
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor]);

  // Reset the composer only once the server actually confirms the send —
  // a hard reset via the editor's own API, not a React-controlled value,
  // so there's no race between "did the browser submit the old text" and
  // "did we clear it in time." It just can't go stale.
  useEffect(() => {
    if (sentCount === 0) return;
    editor?.commands.clearContent();
    if (hiddenBodyRef.current) hiddenBodyRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileName(null);
    editor?.commands.focus();
  }, [sentCount, editor]);

  const toolBtn = (active: boolean) =>
    `w-7 h-7 rounded-md flex items-center justify-center transition-all ${
      active ? "bg-ink text-paper" : "text-muted hover:bg-white hover:text-ink hover:shadow-sm"
    }`;

  return (
    <form
      ref={formRef}
      action={formAction}
      encType="multipart/form-data"
      className="mt-4"
      onSubmit={() => {
        if (hiddenBodyRef.current) hiddenBodyRef.current.value = editor?.isEmpty ? "" : editor?.getHTML() || "";
      }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="body" ref={hiddenBodyRef} defaultValue="" />
      <div className="rounded-xl border border-line bg-white overflow-hidden focus-within:border-apricot/50 transition-colors">
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-paper-dim/60 border-b border-line">
          <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={toolBtn(!!editor?.isActive("bold"))} title="Bold">
            <Bold size={14} />
          </button>
          <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={toolBtn(!!editor?.isActive("italic"))} title="Italic">
            <Italic size={14} />
          </button>
          <span className="w-px h-4 bg-line mx-1" />
          <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={toolBtn(!!editor?.isActive("bulletList"))} title="Bullet list">
            <List size={14} />
          </button>
          <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={toolBtn(!!editor?.isActive("orderedList"))} title="Numbered list">
            <ListOrdered size={14} />
          </button>
          <span className="w-px h-4 bg-line mx-1" />
          <label className={`${toolBtn(false)} cursor-pointer`} title="Attach a file">
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
          <div className="flex-1 relative" style={{ minHeight: 40 }}>
            {editor?.isEmpty && (
              <p className="absolute top-0 left-0 text-sm text-muted pointer-events-none">Write a message…</p>
            )}
            <EditorContent editor={editor} />
          </div>
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
