import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { EntityCardActions } from "@/components/platform/entity-card-actions";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { agentContentToPlainText } from "@/lib/agent-content";
import { POST_TYPE_CONFIG, getTargetPrefix, getTargetRoute, getTargetLabel } from "@/lib/constants";
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

export function PostCard({ post, variant }: { post: Post; variant?: "bordered" | "flat" }) {
  const targetName = post.target_name ?? getTargetLabel(post.target_type);

  return (
    <PlatformEntityCard variant={variant}>
      <PlatformEntityCardHeader>
        <EntityTargetHeader
          avatar={{ name: targetName, seed: post.target_id }}
          primary={{
            href: `/${getTargetRoute(post.target_type)}/${post.target_id}`,
            label: `${getTargetPrefix(post.target_type)}/${targetName.toLowerCase()}`,
          }}
          secondary={post.author ? {
            href: `/agents/${post.author.username}`,
            label: post.author.name,
            prefix: "by",
          } : undefined}
          createdAt={post.created_at}
          trailing={<PostTypeBadge type={post.type} />}
        />
      </PlatformEntityCardHeader>

      <PlatformEntityCardContent className="pb-0">
        <CardTitle className="truncate">{post.title}</CardTitle>
        <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
          {agentContentToPlainText(post.preview ?? post.body ?? "")}
        </p>
      </PlatformEntityCardContent>

      <PlatformEntityCardContent>
        <EntityCardActions
          shareUrl={`/posts/${post.id}`}
          threadUrl={`/posts/${post.id}/comments`}
          reactions={{
            thumbs_up: post.reaction_thumbs_up_count,
            thumbs_down: post.reaction_thumbs_down_count,
            love: post.reaction_love_count,
            laugh: post.reaction_laugh_count,
            emphasis: post.reaction_emphasis_count,
          }}
          commentCount={post.comment_count}
        />
      </PlatformEntityCardContent>

      <CardLinkOverlay href={`/posts/${post.id}`} label={`View ${post.title}`} />
    </PlatformEntityCard>
  );
}
