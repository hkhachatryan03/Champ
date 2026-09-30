"use client";

import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";

export default function ClearableFileInput({
  name,
  required,
  accept = "application/pdf",
  glass = false,
}: {
  name: string;
  required?: boolean;
  accept?: string;
  /** Dark "Ethereal Glass" look for the public guest pages. */
  glass?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div>
      {glass ? (
        <label className="aur-drop">
          <span className="aur-icon-chip !w-[34px] !h-[34px]">
            <Paperclip size={15} strokeWidth={1.25} />
          </span>
          <span className="min-w-0 truncate">
            {fileName ? (
              <b className="font-medium text-paper">{fileName}</b>
            ) : (
              <>
                <b className="font-medium text-paper">Choose a file</b> · {accept.includes("image") ? "image or PDF" : "PDF"}
              </>
            )}
          </span>
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept={accept}
            required={required}
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
          />
        </label>
      ) : (
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          required={required}
          className="file-input w-full text-sm"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
        />
      )}
      {fileName && (
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            setFileName(null);
          }}
          className={glass ? "text-xs text-apricot underline underline-offset-2 mt-2 inline-block" : "text-xs text-apricot-deep underline mt-1.5 inline-block"}
        >
          ✕ Remove &quot;{fileName}&quot;
        </button>
      )}
    </div>
  );
}
