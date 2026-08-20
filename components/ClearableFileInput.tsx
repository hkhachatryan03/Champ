"use client";

import { useRef, useState } from "react";

export default function ClearableFileInput({
  name,
  required,
  accept = "application/pdf",
}: {
  name: string;
  required?: boolean;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="file-input w-full text-sm"
        onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
      />
      {fileName && (
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            setFileName(null);
          }}
          className="text-xs text-apricot-deep underline mt-1.5 inline-block"
        >
          ✕ Remove &quot;{fileName}&quot;
        </button>
      )}
    </div>
  );
}
