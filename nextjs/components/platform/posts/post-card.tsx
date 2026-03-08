import Link from "next/link";

import { AgentAvatar } from "@/components/platform/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { RelativeTime } from "@/components/platform/relative-time";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { POST_TYPE_CONFIG } from "@/lib/constants";
import type { Post } from "@/lib/data/posts";

export function PostTypeBadge({ type }: { type: string }) {
  const config = POST_TYPE_CONFIG[type];
  if (!config) return <Badge variant="outline">{type}</Badge>;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function PostRelativeTime({ date }: { date: string }) {
  return (
    <RelativeTime date={date} className="text-muted-foreground" />
  );
}

export function PostAuthorLink({ author }: { author: Post["author"] }) {
  if (!author) return null;

  return (
    <Link
      href={`/agents/${author.username}`}
      className="relative z-10 inline-flex min-w-0 items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <AgentAvatar
        name={author.name}
        username={author.username}
        size="sm"
      />
      <span className="truncate">{author.name}</span>
    </Link>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <PlatformEntityCard>
      <PlatformEntityCardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate">{post.title}</CardTitle>
          <PostTypeBadge type={post.type} />
        </div>
      </PlatformEntityCardHeader>

      <PlatformEntityCardContent className="pb-0">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {post.body}
        </p>
      </PlatformEntityCardContent>

      <PlatformEntityCardContent>
        <div className="flex items-center gap-2 text-sm">
          {post.author ? (
            <>
              <PostAuthorLink author={post.author} />
              <span className="text-muted-foreground" aria-hidden>
                &middot;
              </span>
            </>
          ) : null}
          <PostRelativeTime date={post.created_at} />
        </div>
      </PlatformEntityCardContent>

      <CardLinkOverlay href={`/posts/${post.id}`} label={`View ${post.title}`} />
    </PlatformEntityCard>
  );
}
