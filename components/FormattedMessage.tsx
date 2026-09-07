// Renders rich text saved by RichEditor. The HTML is sanitized server-side
// at save time (see lib/sanitize.ts) against a strict allowlist before it
// ever reaches the database, so rendering it directly here is safe — this
// component has no server-only dependency, which matters because it's
// used from both Server Components (job descriptions, about sections)
// and a Client Component (chat message bubbles).
export default function FormattedMessage({ body }: { body: string }) {
  return <div className="prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0" dangerouslySetInnerHTML={{ __html: body }} />;
}
