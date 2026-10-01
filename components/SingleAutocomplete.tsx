"use client";

import { useState } from "react";

export default function SingleAutocomplete({
  name,
  options,
  defaultValue,
  placeholder,
  required,
  glass = false,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  /** Dark "Ethereal Glass" look. Default = original light input. */
  glass?: boolean;
}) {
  const [value, setValue] = useState(defaultValue || "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = value
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : options.slice(0, 8);

  return (
    <div className="relative">
      <input
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={glass ? "aur-field" : "w-full px-3 py-2 rounded-lg border border-line text-sm outline-none"}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          className={
            glass
              ? "absolute z-20 mt-1.5 w-full bg-[#1b1f26] border border-paper/15 rounded-xl shadow-[0_18px_40px_-18px_rgba(0,0,0,.8)] overflow-hidden max-h-48 overflow-y-auto"
              : "absolute z-10 mt-1 w-full bg-white border border-line rounded-lg shadow-sm overflow-hidden max-h-48 overflow-y-auto"
          }
        >
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              // Keeps the input focused through the click so onBlur doesn't
              // close the list before the click actually registers.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setValue(s);
                setShowSuggestions(false);
              }}
              className={glass ? "w-full text-left px-3 py-2 text-[13px] text-paper/85 hover:bg-paper/10 transition-colors" : "w-full text-left px-3 py-2 text-sm hover:bg-paper-dim"}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
