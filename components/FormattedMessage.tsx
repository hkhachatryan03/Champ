// Renders a small, safe subset of markdown-style formatting for chat
// messages: **bold**, *italic*, "- " bullet lines, and "1. " numbered
// lines. Deliberately built as plain React elements (never
// dangerouslySetInnerHTML) so there's no way for a message to inject HTML.
import React from "react";

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on **bold** and *italic* without letting them nest/overlap oddly.
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key++}>{match[3]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export default function FormattedMessage({ body }: { body: string }) {
  const lines = body.split("\n");
  const blocks: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let blockKey = 0;

  const flushList = () => {
    if (!currentList) return;
    const Tag = currentList.type;
    blocks.push(
      <Tag key={blockKey++} className={Tag === "ul" ? "list-disc pl-5" : "list-decimal pl-5"}>
        {currentList.items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </Tag>
    );
    currentList = null;
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^-\s+(.*)/);
    const numberedMatch = line.match(/^\d+\.\s+(.*)/);

    if (bulletMatch) {
      if (currentList && currentList.type !== "ul") flushList();
      if (!currentList) currentList = { type: "ul", items: [] };
      currentList.items.push(bulletMatch[1]);
    } else if (numberedMatch) {
      if (currentList && currentList.type !== "ol") flushList();
      if (!currentList) currentList = { type: "ol", items: [] };
      currentList.items.push(numberedMatch[1]);
    } else {
      flushList();
      if (line.trim()) {
        blocks.push(<div key={blockKey++}>{renderInline(line)}</div>);
      } else {
        blocks.push(<div key={blockKey++} style={{ height: 6 }} />);
      }
    }
  }
  flushList();

  return <>{blocks}</>;
}
