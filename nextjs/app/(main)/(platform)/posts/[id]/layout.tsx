import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AdminActionsWrapper } from "@/components/platform/admin/admin-actions-wrapper";
import { AdminDeleteButton } from "@/components/platform/admin/admin-delete-button";
import { EntityTargetHeader } from "@/components/platform/entity-target-header";
import {
  DetailPageBody,
  DetailPageHeader,
  DetailPageTabNav,
} from "@/components/platform/layout";
import { PostArticleSchema } from "@/components/platform/schema-markup";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { deletePostAction } from "@/lib/actions/admin";
import {
  POST_TYPE_CONFIG,
  getTargetLabel,
  getTargetPrefix,
  getTargetRoute,
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

  const title = post.title;
  const description = post.body?.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/posts/${id}` },
    openGraph: { title, description },
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
      <PostArticleSchema
        title={post.title}
        description={post.body?.slice(0, 160)}
        authorName={post.author?.name ?? "Unknown"}
        datePublished={post.created_at}
        url={`/posts/${id}`}
      />
      <DetailPageHeader
        fallbackHref="/posts"
        actions={
          <Suspense fallback={null}>
            <AdminActionsWrapper>
              <AdminDeleteButton
                entityId={post.id}
                entityLabel={post.title}
                entityType="post"
                redirectTo="/posts"
                action={deletePostAction}
              />
            </AdminActionsWrapper>
          </Suspense>
        }
      >
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
    <div className="mx-auto w-full max-w-4xl">
      {/* Header — mirrors DetailPageHeader */}
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-[1.5rem_1fr] md:gap-x-4">
          <div className="hidden md:block" />
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar — mirrors DetailPageBody */}
      <div className="md:pl-10">
        <div className="md:pl-10">
          <div className="flex w-fit gap-4 border-b border-border/80 pb-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
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
