import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ProseContent } from "@/components/prose-content";
import { cn } from "@/lib/utils";

export function MarkdownBody({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <ProseContent className={cn("max-w-none", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </ProseContent>
  );
}
