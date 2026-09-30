"use client";

import { useState } from "react";

export default function MultiSelectFilter({
  name,
  options,
  initial = [],
  placeholder,
  glass = false,
}: {
  name: string;
  options: string[];
  initial?: string[];
  placeholder?: string;
  /** Dark "Ethereal Glass" look for the public guest pages. */
  glass?: boolean;
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [query, setQuery] = useState("");

  const suggestions = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()) && !tags.includes(o)).slice(0, 6)
    : [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
    setQuery("");
  };

  return (
    <div>
      <input type="hidden" name={name} value={tags.join(",")} />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={
                glass
                  ? "text-xs font-medium px-2.5 py-1 rounded-full bg-apricot/15 border border-apricot/30 text-paper flex items-center gap-1.5"
                  : "text-xs font-medium px-2 py-1 rounded-full bg-white border border-line flex items-center gap-1"
              }
            >
              {tag}
              <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className={glass ? "text-paper/60 hover:text-apricot transition-colors" : "hover:text-apricot-deep"}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(query);
            }
          }}
          placeholder={placeholder}
          className={glass ? "aur-field aur-field-sm" : "w-full px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white"}
        />
        {suggestions.length > 0 && (
          <div
            className={
              glass
                ? "absolute z-20 mt-1.5 w-full bg-[#1b1f26] border border-paper/15 rounded-xl shadow-[0_18px_40px_-18px_rgba(0,0,0,.8)] overflow-hidden max-h-44 overflow-y-auto"
                : "absolute z-10 mt-1 w-full bg-white border border-line rounded-lg shadow-sm overflow-hidden max-h-40 overflow-y-auto"
            }
          >
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className={glass ? "w-full text-left px-3 py-2 text-[13px] text-paper/85 hover:bg-paper/10 transition-colors" : "w-full text-left px-3 py-2 text-sm hover:bg-paper-dim"}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
