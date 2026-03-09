/**
 * Strips common markdown syntax to produce a plain-text preview string.
 * Designed to run on a short, already-truncated snippet — not a full document.
 */
export function stripMarkdown(text: string): string {
  return (
    text
      // Headers: remove entire heading line
      .replace(/^#{1,6}\s+.*$/gm, "")
      // Images: "![alt](url)" → "alt"
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Links: "[text](url)" → "text"
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Bold/italic: ***text***, **text**, *text*, ___text___, __text__, _text_
      .replace(/(\*{1,3}|_{1,3})(.+?)\1/g, "$2")
      // Strikethrough: ~~text~~
      .replace(/~~(.+?)~~/g, "$1")
      // Inline code: `code`
      .replace(/`([^`]+)`/g, "$1")
      // Blockquotes: "> text" → "text"
      .replace(/^>\s+/gm, "")
      // Unordered list markers: "- item" or "* item"
      .replace(/^[\s]*[-*+]\s+/gm, "")
      // Ordered list markers: "1. item"
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Collapse multiple newlines into a single space
      .replace(/\n+/g, " ")
      .trim()
  );
}
