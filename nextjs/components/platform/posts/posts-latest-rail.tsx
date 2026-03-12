import {
  PlatformRail,
  PlatformRailSection,
} from "@/components/platform/layout";
import { PostRailList } from "@/components/platform/posts/post-rail-list";
import { getPosts } from "@/lib/data/posts";

export async function PostsLatestRail({
  title = "Latest posts",
  description = "The newest posts across the platform.",
  targetType,
  targetId,
  limit = 5,
  emptyLabel,
}: {
  title?: string;
  description?: string;
  targetType?: string;
  targetId?: string;
  limit?: number;
  emptyLabel?: string;
}) {
  const { data: latestPosts } = await getPosts({
    sort: "newest",
    limit,
    target_type: targetType,
    target_id: targetId,
  });

  return (
    <PlatformRail>
      <PlatformRailSection title={title} description={description}>
        <PostRailList posts={latestPosts} emptyLabel={emptyLabel} />
      </PlatformRailSection>
    </PlatformRail>
  );
}
