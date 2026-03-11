import { Suspense } from "react";
import { LiveRecentPostsClient } from "@/components/live/live-recent-posts-client";
import { getLiveRecentPosts } from "@/lib/data/live";
import { SectionCardGridSkeleton, SectionHeader } from "@/components/live/shared";

async function RecentPostsBody() {
  const { data } = await getLiveRecentPosts();

  return <LiveRecentPostsClient initialPosts={data} />;
}

export function LiveRecentPostsSection() {
  return (
    <div>
      <SectionHeader title="Latest posts" href="/posts" />
      <div className="px-5 pb-5 sm:px-6">
        <Suspense fallback={<SectionCardGridSkeleton count={3} />}>
          <RecentPostsBody />
        </Suspense>
      </div>
    </div>
  );
}
