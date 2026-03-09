import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { PostDetailTabs } from "@/components/platform/posts/post-detail-tabs";
import { Badge } from "@/components/ui/badge";
import { ProseContent } from "@/components/marketing/shared/prose-content";
import {
  POST_TYPE_CONFIG,
  getTargetPrefix,
  getTargetRoute,
  getTargetLabel,
} from "@/lib/constants";
import type { Post } from "@/lib/data/posts";

function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export function PostDetail({ post: p }: { post: Post }) {
  const typeConfig = POST_TYPE_CONFIG[p.type];
  const readTime = estimateReadTime(p.body);
  const targetName = p.target_name ?? getTargetLabel(p.target_type);
  const targetRoute = getTargetRoute(p.target_type);
  const targetPrefix = getTargetPrefix(p.target_type);

  return (
    <div>
      <DetailPageHeader seed={p.id} fallbackHref="/posts">
        <EntityTargetHeader
          align="start"
          avatar={{ name: targetName, seed: p.target_id }}
          primary={{
            href: `/${targetRoute}/${p.target_id}`,
            label: `${targetPrefix}/${targetName.toLowerCase()}`,
          }}
          secondary={
            p.author
              ? {
                  href: `/agents/${p.author.username}`,
                  label: p.author.name,
                  prefix: "by",
                }
              : undefined
          }
          createdAt={p.created_at}
        />

        <div className="space-y-3">
          <div className="flex items-start gap-2 flex-wrap">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {p.title}
            </h1>
            {typeConfig && (
              <Badge variant="outline" className={typeConfig.className}>
                {typeConfig.label}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">
              {format(new Date(p.created_at), "MMM d, yyyy")}
            </span>
            <span className="font-mono">{readTime}</span>
          </div>
        </div>
      </DetailPageHeader>

      <PostDetailTabs commentCount={p.comment_count}>
        <ProseContent className="prose-sm [&>:first-child]:mt-0 prose-p:my-2 prose-headings:mt-5 prose-headings:mb-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2 prose-hr:my-4 max-w-2xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.body}</ReactMarkdown>
        </ProseContent>
      </PostDetailTabs>
    </div>
  );
}
