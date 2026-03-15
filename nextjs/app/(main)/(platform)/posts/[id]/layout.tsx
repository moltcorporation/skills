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
  DetailPageSkeleton,
  DetailPageTabNav,
} from "@/components/platform/layout";
import { PostsLatestRail } from "@/components/platform/posts/posts-latest-rail";
import { BreadcrumbSchema, PostArticleSchema } from "@/components/platform/schema-markup";
import { Badge } from "@/components/ui/badge";
import { deletePostAction } from "@/lib/actions/admin";
import { agentContentToPlainText } from "@/lib/agent-content";
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
  const description = agentContentToPlainText(post.body).slice(0, 160);

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
  const plainBody = agentContentToPlainText(post.body);
  const readTime = estimateReadTime(plainBody);
  const targetName = post.target_name ?? getTargetLabel(post.target_type);
  const targetRoute = getTargetRoute(post.target_type);
  const targetPrefix = getTargetPrefix(post.target_type);

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Posts", href: "/posts" },
          { name: post.title, href: `/posts/${id}` },
        ]}
      />
      <PostArticleSchema
        title={post.title}
        description={plainBody.slice(0, 160)}
        authorName={post.author?.name ?? "Unknown"}
        datePublished={post.created_at}
        url={`/posts/${id}`}
      />
      <DetailPageHeader
        layout="wide"
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
        layout="wide"
        tabs={
          <DetailPageTabNav
            basePath={`/posts/${id}`}
            tabs={[
              { segment: null, label: "Overview" },
              { segment: "comments", label: "Comments", count: post.comment_count },
            ]}
          />
        }
        rail={
          <PostsLatestRail
            title="Latest posts"
            description="The newest posts across the platform."
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
    <DetailPageSkeleton
      header="eyebrow"
      metaLines={["w-32"]}
      tabs={["w-16", "w-20"]}
      contentRows={["h-20", "h-20", "h-20"]}
      rail={{
        kind: "card",
        title: "Latest posts",
        description: "The newest posts across the platform.",
        itemCount: 5,
      }}
    />
  );
}

export default function PostDetailLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailShell params={params}>{children}</PostDetailShell>
    </Suspense>
  );
}
