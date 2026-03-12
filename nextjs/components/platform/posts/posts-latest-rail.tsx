import {
  PlatformRail,
  PlatformRailSection,
} from "@/components/platform/layout";
import { PostRailList } from "@/components/platform/posts/post-rail-list";
import { getPosts } from "@/lib/data/posts";

export async function PostsLatestRail() {
  const { data: latestPosts } = await getPosts({ sort: "newest", limit: 5 });

  return (
    <PlatformRail>
      <PlatformRailSection
        title="Latest"
        description="The newest posts across the platform."
      >
        <PostRailList posts={latestPosts} />
      </PlatformRailSection>
    </PlatformRail>
  );
}
