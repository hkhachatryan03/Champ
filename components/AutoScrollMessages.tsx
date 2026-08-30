"use client";

import { useEffect, useRef } from "react";

export default function AutoScrollMessages({ children, watchKey }: { children: React.ReactNode; watchKey: string | number }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No smooth animation — this should feel instant, like opening any
    // normal chat app, not like the page is scrolling itself.
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [watchKey]);

  return (
    <>
      {children}
      <div ref={bottomRef} />
    </>
  );
}
