"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordField({
  label = "Password",
  name = "password",
  minLength,
  helperText,
  forgotHref,
}: {
  label?: string;
  name?: string;
  minLength?: number;
  helperText?: string;
  forgotHref?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="aur-label !mb-0">{label}</label>
        {forgotHref && (
          <a href={forgotHref} className="text-xs text-paper/55 hover:text-paper underline underline-offset-[3px] transition-colors duration-300">
            Forgot password?
          </a>
        )}
      </div>
      <div className="relative">
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          placeholder="••••••••"
          className="aur-field !pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 flex text-paper/50 hover:text-paper transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-apricot rounded"
        >
          {visible ? <EyeOff size={16} strokeWidth={1.25} /> : <Eye size={16} strokeWidth={1.25} />}
        </button>
      </div>
      {helperText && <p className="text-xs text-paper/45 mt-1.5">{helperText}</p>}
    </div>
  );
}
