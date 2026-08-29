"use client";

import { useState } from "react";

export default function MultiSelectFilter({
  name,
  options,
  initial = [],
  placeholder,
}: {
  name: string;
  options: string[];
  initial?: string[];
  placeholder?: string;
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
            <span key={tag} className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-line flex items-center gap-1">
              {tag}
              <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-apricot-deep">
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
          className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-line rounded-lg shadow-sm overflow-hidden max-h-40 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-paper-dim"
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
