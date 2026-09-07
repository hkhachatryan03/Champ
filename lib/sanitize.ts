import sanitizeHtml from "sanitize-html";

// The rich text editor's own schema only lets it produce a handful of
// tags — but a request to our server actions doesn't have to come from
// that editor. This is the actual safety boundary: no matter what HTML
// arrives, only this allowlisted subset survives.
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "strong", "em", "ul", "ol", "li", "br"],
    allowedAttributes: {},
    // Collapse anything else down to plain text rather than dropping it
    // silently, so content never just vanishes.
    disallowedTagsMode: "discard",
  }).trim();
}
