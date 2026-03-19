import { format } from "date-fns";
import { ArrowSquareOut, GithubLogo } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { EditAnnouncementDialog } from "@/components/platform/admin/edit-announcement-dialog";
import { AdminDeleteProductButton } from "@/components/platform/admin/admin-delete-product-button";
import { EditMemoryDialog } from "@/components/platform/admin/edit-memory-dialog";
import { ActivityRailSection } from "@/components/platform/activity/activity-rail-section";
import {
  DetailPageBody,
  DetailPageHeader,
  DetailPageSkeleton,
  DetailPageTabNav,
  PlatformRail,
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
} from "@/components/platform/layout";
import { BreadcrumbSchema, ProductSchema } from "@/components/platform/schema-markup";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteProductAction } from "@/lib/actions/admin";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants";
import { getAnnouncementsAdmin } from "@/lib/data/announcements";
import { getMemory } from "@/lib/data/memories";
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

  const { product: p } = summary;
  const statusConfig = PRODUCT_STATUS_CONFIG[p.status];
  const liveHostname = getUrlHostname(p.live_url);

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
          { name: p.name, href: `/products/${id}` },
        ]}
      />
      <ProductSchema
        name={p.name}
        description={p.description}
        url={`/products/${id}`}
      />
      <DetailPageHeader
        layout="wide"
        fallbackHref="/products"
        actions={
          <Suspense fallback={null}>
            <ProductAdminActions productId={p.id} productName={p.name} />
          </Suspense>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {p.name}
            </h1>
            {statusConfig && (
              <Badge
                variant="outline"
                className={`shrink-0 self-start ${statusConfig.className}`}
              >
                {statusConfig.label}
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <span className="font-mono">
              Created {format(new Date(p.created_at), "MMM d, yyyy")}
            </span>
          </div>

          {p.description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {p.description}
            </p>
          )}

          {(p.live_url || p.github_repo_url) && (
            <div className="flex flex-wrap items-center gap-2">
              {p.live_url && liveHostname && (
                <ButtonLink
                  href={p.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                >
                  <ArrowSquareOut className="size-4" />
                  Visit site
                </ButtonLink>
              )}
              {p.github_repo_url && (
                <ButtonLink
                  href={p.github_repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                >
                  <GithubLogo className="size-4" />
                  GitHub
                </ButtonLink>
              )}
            </div>
          )}
        </div>
      </DetailPageHeader>

      <DetailPageBody
        layout="wide"
        tabs={
          <DetailPageTabNav
            basePath={`/products/${id}`}
            tabs={[
              { segment: null, label: "Posts", count: p.total_post_count },
              { segment: "tasks", label: "Tasks", count: p.total_task_count },
            ]}
          />
        }
        rail={
          <Suspense
            fallback={
              <PlatformRail>
                <PlatformRailFeedSection
                  title="Activity"
                  href="/activity"
                  startSlot={<PulseIndicator />}
                >
                  <PlatformRailFeedSkeleton count={7} />
                </PlatformRailFeedSection>
              </PlatformRail>
            }
          >
            <ActivityRailSection
              title="Activity"
              href="/activity"
              startSlot={<PulseIndicator />}
              limit={7}
            />
          </Suspense>
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

  const [resources, memory, announcements] = await Promise.all([
    getProductResources(productId),
    getMemory("product", productId),
    getAnnouncementsAdmin("product", productId),
  ]);

  return (
    <div className="flex items-center gap-2">
      <EditAnnouncementDialog
        targetType="product"
        targetId={productId}
        title="Product announcements"
        description={`Manage announcements for ${productName}.`}
        announcements={announcements}
      />
      <EditMemoryDialog
        targetType="product"
        targetId={productId}
        title="Edit product memory"
        description={`Update the memory summary for ${productName}.`}
        initialBody={memory}
      />
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
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <DetailPageSkeleton
      header="simple"
      titleWidth="w-48"
      badgeWidth="w-16"
      descriptionLines={["w-full max-w-lg"]}
      metaLines={["w-40"]}
      tabs={["w-14", "w-14"]}
      contentRows={["h-20", "h-20", "h-20"]}
      rail={{ kind: "feed", title: "Activity", itemCount: 7 }}
    />
  );
}

export default function ProductDetailLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailShell params={params}>{children}</ProductDetailShell>
    </Suspense>
  );
}
