import { format } from "date-fns";
import { ArrowSquareOut, GithubLogo } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AdminDeleteProductButton } from "@/components/platform/admin/admin-delete-product-button";
import { DetailPageBody } from "@/components/platform/detail-page-body";
import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { DetailPageTabNav } from "@/components/platform/detail-page-tab-nav";
import { ProductSchema } from "@/components/platform/schema-markup";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteProductAction } from "@/lib/actions/admin";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants";
import { getProductResources, getProductSummary } from "@/lib/data/products";
import { getUrlHostname } from "@/lib/url";

type Props = {
  params: Promise<{ id: string }>;
  children: ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: summary } = await getProductSummary(id);

  if (!summary) return { title: "Product Not Found" };

  const title = summary.product.name;
  const description = summary.product.description?.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: { title, description },
  };
}

async function ProductDetailShell({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const { data: summary } = await getProductSummary(id);
  if (!summary) notFound();

  const { product: p, counts } = summary;
  const statusConfig = PRODUCT_STATUS_CONFIG[p.status];
  const liveHostname = getUrlHostname(p.live_url);

  return (
    <div>
      <ProductSchema
        name={p.name}
        description={p.description}
        url={`/products/${id}`}
      />
      <DetailPageHeader
        seed={p.id}
        fallbackHref="/products"
        actions={
          <Suspense fallback={null}>
            <ProductAdminActions productId={p.id} productName={p.name} />
          </Suspense>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 flex-wrap">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {p.name}
            </h1>
            {statusConfig && (
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            )}
          </div>

          {p.description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {p.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-mono">
              Created {format(new Date(p.created_at), "MMM d, yyyy")}
            </span>
            {p.updated_at && p.updated_at !== p.created_at && (
              <>
                <span aria-hidden>&middot;</span>
                <span className="font-mono">
                  Updated {format(new Date(p.updated_at), "MMM d, yyyy")}
                </span>
              </>
            )}
            {(p.live_url || p.github_repo_url) && (
              <span aria-hidden>&middot;</span>
            )}
            {p.live_url && liveHostname && (
              <a
                href={p.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <ArrowSquareOut className="size-3" />
                {liveHostname}
              </a>
            )}
            {p.github_repo_url && (
              <a
                href={p.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <GithubLogo className="size-3" />
                GitHub
              </a>
            )}
          </div>
        </div>
      </DetailPageHeader>

      <DetailPageBody
        tabs={
          <DetailPageTabNav
            basePath={`/products/${id}`}
            tabs={[
              { segment: null, label: "Posts", count: counts.posts },
              { segment: "tasks", label: "Tasks", count: counts.tasks },
            ]}
          />
        }
      >
        {children}
      </DetailPageBody>
    </div>
  );
}

async function ProductAdminActions({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { getIsAdmin } = await import("@/lib/admin");
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return null;

  const resources = await getProductResources(productId);

  return (
    <AdminDeleteProductButton
      productId={productId}
      productName={productName}
      resources={{
        githubRepoUrl: resources?.github_repo_url ?? null,
        vercelProjectId: resources?.vercel_project_id ?? null,
        neonProjectId: resources?.neon_project_id ?? null,
        liveUrl: resources?.live_url ?? null,
      }}
      action={deleteProductAction}
    />
  );
}

function ProductDetailSkeleton() {
  return (
    <div>
      <div className="-mx-5 overflow-hidden sm:-mx-6">
        <div className="px-5 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-[1.5rem_1fr] md:gap-x-4">
            <div className="hidden md:block" />
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full max-w-lg" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-border" />
      </div>

      <div className="-mx-5 border-b border-border px-5 py-1 sm:-mx-6 sm:px-6">
        <div className="md:pl-10">
          <div className="flex gap-4 py-1.5">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailShell params={params}>{children}</ProductDetailShell>
    </Suspense>
  );
}
