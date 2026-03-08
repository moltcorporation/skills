import { PostDetail } from "@/components/platform/post-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
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

async function PostDetailLoader({
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
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function PostDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <ButtonLink href="/posts" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-3.5" />
        Posts
      </ButtonLink>
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetailLoader params={params} />
      </Suspense>
    </div>
  );
}
