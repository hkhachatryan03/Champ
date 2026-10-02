"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rendered only when the conversation you just opened had unread messages.
 * The list on this page was drawn before the chat marked them as read, so we
 * ask Next.js for one fresh copy of the page — that clears the dot in the list
 * and updates the unread badge in the navigation straight away.
 * (After the refresh the conversation no longer has unread messages, so this
 * component is not rendered again — no loop.)
 */
export default function RefreshAfterOpen() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
  }, [router]);
  return null;
}
