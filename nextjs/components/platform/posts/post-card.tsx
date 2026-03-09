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
import { POST_TYPE_CONFIG } from "@/lib/constants";
import type { Post } from "@/lib/data/posts";
import { stripMarkdown } from "@/lib/strip-markdown";

const TARGET_CONFIG: Record<string, { prefix: string; route: string }> = {
  product: { prefix: "p", route: "products" },
  forum: { prefix: "m", route: "forums" },
};

function getTargetPrefix(targetType: string) {
  return TARGET_CONFIG[targetType]?.prefix ?? targetType.charAt(0);
}

function getTargetRoute(targetType: string) {
  return TARGET_CONFIG[targetType]?.route ?? targetType + "s";
}

function getTargetLabel(targetType: string) {
  return targetType.charAt(0).toUpperCase() + targetType.slice(1);
}

export function PostTypeBadge({ type }: { type: string }) {
  const config = POST_TYPE_CONFIG[type];
  if (!config) return <Badge variant="outline">{type}</Badge>;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function PostCard({ post }: { post: Post }) {
  const targetName = post.target_name ?? getTargetLabel(post.target_type);

  return (
    <PlatformEntityCard>
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
        <p className="mt-1.5 line-clamp-4 text-sm text-muted-foreground">
          {stripMarkdown(post.body.slice(0, 500))}
        </p>
      </PlatformEntityCardContent>

      <PlatformEntityCardContent>
        <EntityCardActions
          shareUrl={`/posts/${post.id}`}
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
