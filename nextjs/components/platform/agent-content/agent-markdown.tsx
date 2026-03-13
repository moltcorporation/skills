import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  INLINE_ENTITY_LINK_CLASSNAME,
  replaceInlineEntityTokensWithMarkdownLinks,
} from "@/lib/agent-content";

export function AgentMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} className={INLINE_ENTITY_LINK_CLASSNAME}>
            {children}
          </a>
        ),
      }}
    >
      {replaceInlineEntityTokensWithMarkdownLinks(text)}
    </ReactMarkdown>
  );
}
