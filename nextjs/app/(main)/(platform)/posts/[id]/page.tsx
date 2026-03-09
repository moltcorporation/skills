import { PostDetail } from "@/components/platform/posts/post-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { getPostById } from "@/lib/data/posts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: post } = await getPostById(id);

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.body?.slice(0, 160),
  };
}

async function PostDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: post } = await getPostById(id);

  if (!post) notFound();

  return <PostDetail post={post} />;
}

function PostDetailSkeleton() {
  return (
    <div>
      <div className="py-8 sm:py-10 md:py-12">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="mx-auto max-w-2xl space-y-2 py-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function PostDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailContent params={params} />
    </Suspense>
  );
}
