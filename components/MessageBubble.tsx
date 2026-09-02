"use client";

import { useState, useRef } from "react";
import FormattedMessage from "./FormattedMessage";
import type { Message } from "@/lib/queries";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

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
  const [editValue, setEditValue] = useState(message.body);
  const [pending, setPending] = useState(false);
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

  const saveEdit = async () => {
    if (!editValue.trim()) return;
    setPending(true);
    await onEdit(applicationId, message.id, editValue.trim());
    setPending(false);
    setEditing(false);
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
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={2}
                className="text-sm outline-none resize-none bg-white/70 rounded px-2 py-1 text-ink"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditing(false)} className="text-xs underline">
                  Cancel
                </button>
                <button type="button" onClick={saveEdit} disabled={pending} className="text-xs font-medium underline">
                  Save
                </button>
              </div>
            </div>
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
                className="absolute bottom-full mb-1 flex gap-0.5 bg-white border border-line rounded-full shadow-sm px-1.5 py-1 flex-wrap max-w-[180px]"
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
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-paper-dim"
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

      {mine && !isDeleted && (
        <span className="text-[10px] mt-0.5 text-muted">
          {message.read_at ? "Read" : "Sent"}
          {message.edited_at ? " · edited" : ""} · {message.created_at}
        </span>
      )}
    </div>
  );
}
