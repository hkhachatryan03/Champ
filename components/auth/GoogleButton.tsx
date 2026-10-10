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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // The sign-in callback below needs the router, but we don't want a change in
  // the router object's identity to make us re-introduce ourselves to Google
  // (initialize() should run once). A ref gives the callback the latest router
  // without being a dependency.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  // Google draws its button at a fixed pixel width (it can't be told "100%"),
  // so we measure the space we actually have and hand it that number. Google
  // allows 200–400px.
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(200, Math.min(400, Math.floor(el.getBoundingClientRect().width))));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tell Google who we are and what to do with a successful sign-in.
  useEffect(() => {
    if (!scriptReady || !window.google) return;
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
          routerRef.current.push(data.redirectTo);
          routerRef.current.refresh();
        } else if (data.error === "no_account") {
          routerRef.current.push(`/signup?role=${role || "candidate"}&error=no_account`);
        } else {
          setError("Something went wrong signing in with Google — please try again.");
        }
      },
    });
  }, [scriptReady, clientId, mode, role, recruiterType]);

  // (Re)draw the button whenever we learn a new width.
  useEffect(() => {
    if (!scriptReady || !window.google || !buttonRef.current || !width) return;
    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      width,
      text: mode === "signup" ? "signup_with" : "signin_with",
      shape: "pill",
    });
  }, [scriptReady, width, mode]);

  return (
    <div ref={wrapperRef} className="w-full">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      {/* No stretching of Google's wrapper — the button is already exactly as
          wide as this column, and centred if the column is ever wider than 400. */}
      <div ref={buttonRef} className="flex justify-center" />
      {error && <p className="text-xs text-apricot mt-2 text-center">{error}</p>}
    </div>
  );
}
