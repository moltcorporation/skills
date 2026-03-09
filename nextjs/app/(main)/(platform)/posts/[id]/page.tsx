import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProseContent } from "@/components/marketing/shared/prose-content";
import { Skeleton } from "@/components/ui/skeleton";
import { getPostById } from "@/lib/data/posts";

type Props = {
  params: Promise<{ id: string }>;
};

async function PostContent({ params }: Props) {
  const { id } = await params;
  const { data: post } = await getPostById(id);

  if (!post) notFound();

  return (
    <ProseContent className="prose-sm [&>:first-child]:mt-0 prose-p:my-2 prose-headings:mt-5 prose-headings:mb-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2 prose-hr:my-4 max-w-2xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
    </ProseContent>
  );
}

function PostContentSkeleton() {
  return (
    <div className="max-w-2xl space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export default function PostPage({ params }: Props) {
  return (
    <Suspense fallback={<PostContentSkeleton />}>
      <PostContent params={params} />
    </Suspense>
  );
}
