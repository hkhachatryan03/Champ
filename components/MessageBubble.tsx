"use client";

import { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import FormattedMessage from "./FormattedMessage";
import type { Message } from "@/lib/queries";
import { formatChatTimestamp } from "@/lib/dates";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

function InlineEditor({
  initialValue,
  onCancel,
  onSave,
}: {
  initialValue: string;
  onCancel: () => void;
  onSave: (html: string) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false })],
    content: initialValue,
    editorProps: { attributes: { class: "prose-sm max-w-none outline-none text-sm text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" } },
  });

  const save = async () => {
    if (!editor || editor.isEmpty) return;
    setPending(true);
    await onSave(editor.getHTML());
    setPending(false);
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      <div className="bg-white/70 rounded px-2 py-1">
        <EditorContent editor={editor} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-xs underline">
          Cancel
        </button>
        <button type="button" onClick={save} disabled={pending} className="text-xs font-medium underline">
          Save
        </button>
      </div>
    </div>
  );
}

export default function MessageBubble({
  message,
  mine,
  applicationId,
  reactions,
  onEdit,
  onDelete,
  onReact,
}: {
  message: Message;
  mine: boolean;
  applicationId: number;
  reactions: { sender_role: "candidate" | "company"; emoji: string }[];
  onEdit: (applicationId: number, messageId: number, newBody: string) => Promise<void>;
  onDelete: (applicationId: number, messageId: number) => Promise<void>;
  onReact: (applicationId: number, messageId: number, emoji: string) => Promise<void>;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDeleted = !!message.deleted_at;

  // The menu sits a few pixels outside the bubble's own box (absolute
  // positioning doesn't count toward the parent's size), so there's a
  // small real gap the cursor has to cross to get from one to the other.
  // A delayed hide — cancelled if the cursor lands back on either the
  // bubble or the menu in time — means that gap no longer matters.
  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = setTimeout(() => {
      setShowMenu(false);
      setShowReactionPicker(false);
    }, 300);
  };

  return (
    <div className="flex flex-col max-w-[75%]" style={{ alignItems: mine ? "flex-end" : "flex-start", alignSelf: mine ? "flex-end" : "flex-start" }}>
      {/* This wrapper's box never changes size regardless of hover state —
          the action menu below is positioned absolutely, entirely outside
          normal layout flow, so it can never push or resize the bubble
          itself (that was the "changes shape on hover" bug). */}
      <div
        className="relative"
        onMouseEnter={() => {
          cancelHide();
          if (!isDeleted) setShowMenu(true);
        }}
        onMouseLeave={scheduleHide}
      >
        <div className={`px-3 py-2 rounded-xl text-sm ${isDeleted ? "bg-paper-dim/60 text-muted italic" : mine ? "bg-apricot" : "bg-paper-dim"}`}>
          {isDeleted ? (
            "Message deleted"
          ) : editing ? (
            <InlineEditor
              initialValue={message.body}
              onCancel={() => setEditing(false)}
              onSave={async (html) => {
                await onEdit(applicationId, message.id, html);
                setEditing(false);
              }}
            />
          ) : (
            <>
              {message.body && <FormattedMessage body={message.body} />}
              {message.attachment_url && (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 text-xs underline ${message.body ? "mt-1.5" : ""} ${mine ? "text-ink" : "text-apricot-deep"}`}
                >
                  📎 {message.attachment_name || "Attachment"}
                </a>
              )}
            </>
          )}
        </div>

        {!isDeleted && !editing && (showMenu || showReactionPicker) && (
          <div
            className="absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white border border-line rounded-full shadow-sm px-1 py-0.5 z-10"
            style={mine ? { right: "100%", marginRight: 6 } : { left: "100%", marginLeft: 6 }}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
          >
            <button
              type="button"
              onClick={() => setShowReactionPicker((v) => !v)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-paper-dim"
              title="React"
            >
              🙂
            </button>
            {mine && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-paper-dim"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(applicationId, message.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-paper-dim"
                  title="Delete"
                >
                  🗑️
                </button>
              </>
            )}
            {showReactionPicker && (
              <div
                className="absolute bottom-full mb-1 flex items-center gap-0.5 bg-white border border-line rounded-full shadow-sm px-1.5 py-1 whitespace-nowrap"
                style={{ [mine ? "right" : "left"]: 0 }}
                onMouseEnter={cancelHide}
                onMouseLeave={scheduleHide}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReact(applicationId, message.id, emoji);
                      setShowReactionPicker(false);
                    }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-paper-dim flex-shrink-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {reactions.length > 0 && !isDeleted && (
        <div className="flex gap-1 mt-0.5">
          {reactions.map((r) => (
            <span key={r.sender_role} className="text-xs bg-paper-dim rounded-full px-1.5 py-0.5">
              {r.emoji}
            </span>
          ))}
        </div>
      )}

      {!isDeleted && (
        <span className="text-[10px] mt-0.5 text-muted">
          {mine && (message.read_at ? "Read" : "Sent") + " · "}
          {message.edited_at ? "edited · " : ""}
          {formatChatTimestamp(message.created_at)}
        </span>
      )}
    </div>
  );
}
