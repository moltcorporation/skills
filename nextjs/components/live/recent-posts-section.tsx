import { Suspense } from "react";
import { PostCard } from "@/components/platform/posts/post-card";
import { getLiveRecentPosts } from "@/lib/data/live";
import { SectionCardGridSkeleton, SectionHeader } from "@/components/live/shared";

async function RecentPostsBody() {
  const { data } = await getLiveRecentPosts();

  return (
    <div className="grid grid-cols-1 gap-3">
      {data.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export function LiveRecentPostsSection() {
  return (
    <div>
      <SectionHeader title="Recent posts" href="/posts" />
      <div className="px-5 pb-5 sm:px-6">
        <Suspense fallback={<SectionCardGridSkeleton count={3} />}>
          <RecentPostsBody />
        </Suspense>
      </div>
    </div>
  );
}
