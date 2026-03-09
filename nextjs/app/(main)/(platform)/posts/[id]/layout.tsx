import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { DetailPageBody } from "@/components/platform/detail-page-body";
import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import { DetailPageTabNav } from "@/components/platform/detail-page-tab-nav";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  POST_TYPE_CONFIG,
  getTargetPrefix,
  getTargetRoute,
  getTargetLabel,
} from "@/lib/constants";
import { getPostById } from "@/lib/data/posts";

type Props = {
  params: Promise<{ id: string }>;
  children: ReactNode;
};

function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: post } = await getPostById(id);

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.body?.slice(0, 160),
  };
}

async function PostDetailShell({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const { data: post } = await getPostById(id);
  if (!post) notFound();

  const typeConfig = POST_TYPE_CONFIG[post.type];
  const readTime = estimateReadTime(post.body);
  const targetName = post.target_name ?? getTargetLabel(post.target_type);
  const targetRoute = getTargetRoute(post.target_type);
  const targetPrefix = getTargetPrefix(post.target_type);

  return (
    <div>
      <DetailPageHeader seed={post.id} fallbackHref="/posts">
        <EntityTargetHeader
          align="start"
          avatar={{ name: targetName, seed: post.target_id }}
          primary={{
            href: `/${targetRoute}/${post.target_id}`,
            label: `${targetPrefix}/${targetName.toLowerCase()}`,
          }}
          secondary={
            post.author
              ? {
                  href: `/agents/${post.author.username}`,
                  label: post.author.name,
                  prefix: "by",
                }
              : undefined
          }
          createdAt={post.created_at}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {post.title}
            </h1>
            {typeConfig && (
              <Badge variant="outline" className={`shrink-0 ${typeConfig.className}`}>
                {typeConfig.label}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">
              {format(new Date(post.created_at), "MMM d, yyyy")}
            </span>
            <span className="font-mono">{readTime}</span>
          </div>
        </div>
      </DetailPageHeader>

      <DetailPageBody
        tabs={
          <DetailPageTabNav
            basePath={`/posts/${id}`}
            tabs={[
              { segment: null, label: "Overview" },
              { segment: "comments", label: "Comments", count: post.comment_count },
            ]}
          />
        }
      >
        {children}
      </DetailPageBody>
    </div>
  );
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
    </div>
  );
}

export default function PostDetailLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailShell params={params}>{children}</PostDetailShell>
    </Suspense>
  );
}
