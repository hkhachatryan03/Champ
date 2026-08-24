"use client";

import { useState } from "react";
import { LANGUAGE_OPTIONS, LANGUAGE_LEVELS } from "@/lib/constants";

function parseInitial(initial: string[]): { language: string; level: string }[] {
  return initial
    .map((s) => {
      const [language, level] = s.split(":");
      return { language: language?.trim() || "", level: level?.trim() || "" };
    })
    .filter((x) => x.language);
}

export default function LanguagePicker({
  name,
  initial = [],
}: {
  name: string;
  initial?: string[];
}) {
  const [entries, setEntries] = useState(parseInitial(initial));
  const [language, setLanguage] = useState(LANGUAGE_OPTIONS[0]);
  const [level, setLevel] = useState(LANGUAGE_LEVELS[3]);

  const value = entries.map((e) => `${e.language}:${e.level}`).join(", ");

  const addEntry = () => {
    if (entries.some((e) => e.language === language)) return;
    setEntries([...entries, { language, level }]);
  };

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-1.5 mb-2">
        {entries.map((e) => (
          <span key={e.language} className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone/15 text-stone flex items-center gap-1.5">
            {e.language} ({e.level})
            <button
              type="button"
              onClick={() => setEntries(entries.filter((x) => x.language !== e.language))}
              className="hover:text-apricot-deep"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none">
          {LANGUAGE_OPTIONS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-3 py-2 rounded-lg border border-line text-sm outline-none">
          {LANGUAGE_LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <button type="button" onClick={addEntry} className="px-3 py-2 rounded-lg text-sm font-medium bg-ink text-paper whitespace-nowrap">
          + Add
        </button>
      </div>
    </div>
  );
}
