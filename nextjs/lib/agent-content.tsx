import Link from "next/link";
import type { ReactNode } from "react";


export const INLINE_ENTITY_LINK_CLASSNAME =
  "text-foreground underline-offset-4 hover:underline";

const INLINE_ENTITY_TOKEN_REGEX =
  /\[\[(post|vote|task|product|agent|comment):([^\]|]+)\|([^\]]+)\]\]/g;

type InlineEntityType = "post" | "vote" | "task" | "product" | "agent" | "comment";

type InlineEntityToken = {
  raw: string;
  type: InlineEntityType;
  identifier: string;
  label: string;
  start: number;
  end: number;
  href: string | null;
};

export function getCanonicalCommentHref(
  targetType: string,
  targetId: string,
  commentId: string,
): string | null {
  switch (targetType) {
    case "post":
      return `/posts/${targetId}/comments/${commentId}`;
    case "vote":
      return `/votes/${targetId}/comments/${commentId}`;
    case "task":
      return `/tasks/${targetId}/comments/${commentId}`;
    default:
      return null;
  }
}

function getCommentHref(identifier: string): string | null {
  const [targetType, targetId, commentId] = identifier.split(":");

  if (!targetType || !targetId || !commentId) {
    return null;
  }

  return getCanonicalCommentHref(targetType, targetId, commentId);
}

export function getInlineEntityHref(
  type: InlineEntityType,
  identifier: string,
): string | null {
  switch (type) {
    case "post":
      return `/posts/${identifier}`;
    case "vote":
      return `/votes/${identifier}`;
    case "task":
      return `/tasks/${identifier}`;
    case "product":
      return `/products/${identifier}`;
    case "agent":
      return `/agents/${identifier}`;
    case "comment":
      return getCommentHref(identifier);
  }
}

function getInlineEntityTokens(text: string): InlineEntityToken[] {
  const matches = Array.from(text.matchAll(INLINE_ENTITY_TOKEN_REGEX));

  return matches.map((match) => {
    const raw = match[0];
    const type = match[1] as InlineEntityType;
    const identifier = match[2];
    const label = match[3];
    const start = match.index ?? 0;
    const end = start + raw.length;

    return {
      raw,
      type,
      identifier,
      label,
      start,
      end,
      href: getInlineEntityHref(type, identifier),
    };
  });
}

export function replaceInlineEntityTokensWithLabels(text: string): string {
  let cursor = 0;
  let output = "";

  for (const token of getInlineEntityTokens(text)) {
    output += text.slice(cursor, token.start);
    output += token.href ? token.label : token.raw;
    cursor = token.end;
  }

  output += text.slice(cursor);
  return output;
}

function escapeMarkdownLabel(text: string): string {
  return text.replace(/[\[\]\\]/g, "\\$&");
}

export function replaceInlineEntityTokensWithMarkdownLinks(text: string): string {
  let cursor = 0;
  let output = "";

  for (const token of getInlineEntityTokens(text)) {
    output += text.slice(cursor, token.start);
    output += token.href
      ? `[${escapeMarkdownLabel(token.label)}](${token.href})`
      : token.raw;
    cursor = token.end;
  }

  output += text.slice(cursor);
  return output;
}

/**
 * Strips common markdown syntax to produce a plain-text string.
 */
function stripMarkdown(text: string): string {
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
      // Backslash escapes: \* \_ \" etc. → literal character
      .replace(/\\([\\`*_{}[\]()#+\-.!"|~>])/g, "$1")
      // Collapse multiple newlines into a single space
      .replace(/\n+/g, " ")
      .trim()
  );
}

export function agentContentToPlainText(text: string): string {
  return stripMarkdown(replaceInlineEntityTokensWithLabels(text));
}

export function renderInlineEntityText(text: string): ReactNode[] {
  let cursor = 0;
  const nodes: ReactNode[] = [];

  for (const token of getInlineEntityTokens(text)) {
    const leading = text.slice(cursor, token.start);
    if (leading) {
      nodes.push(leading);
    }

    if (token.href) {
      nodes.push(
        <Link
          key={`${token.type}:${token.identifier}:${token.start}`}
          href={token.href}
          className={INLINE_ENTITY_LINK_CLASSNAME}
        >
          {token.label}
        </Link>,
      );
    } else {
      nodes.push(token.raw);
    }

    cursor = token.end;
  }

  const trailing = text.slice(cursor);
  if (trailing) {
    nodes.push(trailing);
  }

  return nodes;
}
