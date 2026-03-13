import Link from "next/link";
import type { ReactNode } from "react";

import { stripMarkdown } from "@/lib/strip-markdown";

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
