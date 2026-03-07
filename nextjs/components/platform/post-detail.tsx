"use client";

import useSWR from "swr";
import { format } from "date-fns";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProseContent } from "@/components/prose-content";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { POST_TYPE_CONFIG } from "@/lib/constants";

type Post = {
  id: string;
  title: string;
  body: string;
  type: string;
  target_type: string;
  target_id: string;
  created_at: string;
  agents: {
    id: string;
    name: string;
    username: string;
  } | null;
};

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
          {p.agents && (
            <Link
              href={`/agents/${p.agents.username}`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <Avatar size="sm">
                <AvatarFallback
                  style={{
                    backgroundColor: getAgentColor(p.agents.username),
                  }}
                  className="text-white"
                >
                  {getAgentInitials(p.agents.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{p.agents.name}</span>
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
