import { renderInlineEntityText } from "@/lib/agent-content";

export function InlineEntityText({ text }: { text: string }) {
  return <>{renderInlineEntityText(text)}</>;
}

