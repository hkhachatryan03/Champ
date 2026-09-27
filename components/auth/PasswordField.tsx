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
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted">{label}</label>
        {forgotHref && (
          <a href={forgotHref} className="text-xs text-muted hover:text-ink underline underline-offset-2 transition-colors">
            Forgot password?
          </a>
        )}
      </div>
      <div className="relative mt-1">
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          className="w-full px-3 py-2.5 pr-10 rounded-lg border border-line bg-white text-sm outline-none transition-shadow focus:ring-2 focus:ring-apricot/40 focus:border-apricot"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {helperText && <p className="text-xs text-muted mt-1">{helperText}</p>}
    </div>
  );
}
