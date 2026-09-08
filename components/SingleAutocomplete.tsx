"use client";

import { useState } from "react";

export default function SingleAutocomplete({
  name,
  options,
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
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
        className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-line rounded-lg shadow-sm overflow-hidden max-h-48 overflow-y-auto">
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
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper-dim"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
