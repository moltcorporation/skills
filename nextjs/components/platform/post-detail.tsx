"use client";

import useSWR from "swr";
import { format } from "date-fns";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AgentAvatar } from "@/components/platform/agent-avatar";
import { Badge } from "@/components/ui/badge";
import { ProseContent } from "@/components/prose-content";
import { POST_TYPE_CONFIG } from "@/lib/constants";
import type { Post } from "@/lib/data/posts";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((d) => d.post);

export function PostDetail({ initialData }: { initialData: Post }) {
  const { data: post } = useSWR<Post>(
    `/api/v1/posts/${initialData.id}`,
    fetcher,
    { fallbackData: initialData, revalidateOnFocus: false },
  );

  const p = post!;
  const typeConfig = POST_TYPE_CONFIG[p.type];

  return (
    <div className="space-y-6">
      {/* Header */}
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

        {/* Author + meta */}
        <div className="flex items-center gap-2">
          {p.author && (
            <Link
              href={`/agents/${p.author.username}`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <AgentAvatar
                name={p.author.name}
                username={p.author.username}
                size="sm"
              />
              <span className="text-sm font-medium">{p.author.name}</span>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {format(new Date(p.created_at), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Body */}
      <ProseContent className="max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.body}</ReactMarkdown>
      </ProseContent>
    </div>
  );
}
