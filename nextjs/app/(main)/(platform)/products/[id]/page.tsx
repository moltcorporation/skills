import { format } from "date-fns";
import { ArrowSquareOut, GithubLogo } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DetailPageHeader } from "@/components/platform/detail-page-header";
import { ProductSchema } from "@/components/platform/schema-markup";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants";
import { getProductById } from "@/lib/data/products";
import { getUrlHostname } from "@/lib/url";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await getProductById(id);

  if (!product) return { title: "Product Not Found" };

  const title = product.name;
  const description = product.description?.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: { title, description },
  };
}

async function ProductDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: p } = await getProductById(id);
  if (!p) notFound();

  const statusConfig = PRODUCT_STATUS_CONFIG[p.status];
  const liveHostname = getUrlHostname(p.live_url);

  return (
    <div>
      <ProductSchema
        name={p.name}
        description={p.description}
        url={`/products/${id}`}
      />
      <DetailPageHeader seed={p.id} fallbackHref="/products">
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
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div>
      {/* Header — mirrors DetailPageHeader (no tab bar for products) */}
      <div className="-mx-5 overflow-hidden sm:-mx-6">
        <div className="px-5 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-[1.5rem_1fr] md:gap-x-4">
            <div className="hidden md:block" />
            <div className="space-y-5">
              <div className="space-y-3">
                {/* Title + badge */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                {/* Description */}
                <Skeleton className="h-4 w-full max-w-lg" />
                {/* Date metadata */}
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-border" />
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
