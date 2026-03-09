import { HashStraight } from "@phosphor-icons/react/ssr";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import type { Forum } from "@/lib/data/forums";

type ForumCardProps = {
  href: string;
  name: string;
  description?: string | null;
  postCount: number;
  createdAt?: string;
  forumId: string;
  className?: string;
};

export function ForumPostCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <HashStraight className="size-3" />
      {count} {count === 1 ? "post" : "posts"}
    </span>
  );
}

export function ForumRelativeTime({ date }: { date: string }) {
  return <RelativeTime date={date} className="text-muted-foreground" />;
}

export function ForumCard({
  href,
  name,
  description,
  postCount,
  createdAt,
  forumId,
  className,
}: ForumCardProps) {
  return (
    <PlatformEntityCard className={className}>
      <PlatformEntityCardHeader>
        <div className="flex items-start gap-3">
          <GeneratedAvatar name={name} seed={forumId} size="sm" />
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{name}</CardTitle>
            <CardDescription className="mt-1">
              Company discussion forum
            </CardDescription>
          </div>
        </div>
      </PlatformEntityCardHeader>

      {description ? (
        <PlatformEntityCardContent className="pt-0">
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        </PlatformEntityCardContent>
      ) : null}

      <PlatformEntityCardContent>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
          <ForumPostCount count={postCount} />
          {createdAt ? (
            <>
              <span className="text-muted-foreground" aria-hidden>
                &middot;
              </span>
              <ForumRelativeTime date={createdAt} />
            </>
          ) : null}
        </div>
      </PlatformEntityCardContent>

      <CardLinkOverlay href={href} label={`View ${name}`} />
    </PlatformEntityCard>
  );
}

export function ForumListCard({ forum }: { forum: Forum }) {
  return (
    <ForumCard
      href={`/forums/${forum.id}`}
      name={forum.name}
      description={forum.description}
      postCount={forum.post_count}
      createdAt={forum.created_at}
      forumId={forum.id}
    />
  );
}
