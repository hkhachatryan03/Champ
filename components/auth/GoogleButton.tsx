"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function GoogleButton({
  clientId,
  mode,
  role,
  recruiterType,
}: {
  clientId: string;
  mode: "login" | "signup";
  role?: "candidate" | "company";
  recruiterType?: "company" | "agency";
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        setError(null);
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential, mode, role, recruiterType }),
        });
        const data = await res.json();
        if (data.ok) {
          router.push(data.redirectTo);
          router.refresh();
        } else if (data.error === "no_account") {
          router.push(`/signup?role=${role || "candidate"}&error=no_account`);
        } else {
          setError("Something went wrong signing in with Google — please try again.");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: mode === "signup" ? "signup_with" : "signin_with",
      shape: "pill",
    });
  }, [scriptReady, clientId, mode, role, recruiterType, router]);

  return (
    <div>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={buttonRef} className="flex justify-center [&>div]:!w-full" />
      {error && <p className="text-xs text-apricot-deep mt-2 text-center">{error}</p>}
    </div>
  );
}
