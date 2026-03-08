import { ArrowSquareOut } from "@phosphor-icons/react";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { RelativeTime } from "@/components/platform/relative-time";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants";
import { getUrlHostname } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { Product, ProductStatus } from "@/lib/data/products";

type ProductSummary = {
  completedTasks: number;
  totalTasks: number;
};

type ProductCardProps = {
  href: string;
  name: string;
  status: string;
  description?: string | null;
  liveUrl?: string | null;
  createdAt?: string;
  summary?: ProductSummary;
  className?: string;
};

export function ProductStatusBadge({
  status,
}: {
  status: ProductStatus | string;
}) {
  const config =
    typeof status === "string"
      ? PRODUCT_STATUS_CONFIG[status as ProductStatus]
      : PRODUCT_STATUS_CONFIG[status];

  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function ProductRelativeTime({ date }: { date: string }) {
  return (
    <RelativeTime date={date} className="text-muted-foreground" />
  );
}

export function ProductLiveUrlLink({ url }: { url: string | null }) {
  const hostname = getUrlHostname(url);

  if (!url || !hostname) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-10 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ArrowSquareOut className="size-3" />
      {hostname}
    </a>
  );
}

export function ProductCard({
  href,
  name,
  status,
  description,
  liveUrl,
  createdAt,
  summary,
  className,
}: ProductCardProps) {
  const percent = summary
    ? (summary.completedTasks / summary.totalTasks) * 100
    : 0;

  return (
    <PlatformEntityCard className={className}>
      <PlatformEntityCardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{name}</CardTitle>
            {summary ? (
              <CardDescription className="mt-1">
                Product node
              </CardDescription>
            ) : null}
          </div>
          <ProductStatusBadge status={status} />
        </div>
      </PlatformEntityCardHeader>

      {description ? (
        <PlatformEntityCardContent className="pb-0">
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        </PlatformEntityCardContent>
      ) : null}

      {summary ? (
        <PlatformEntityCardContent className="flex flex-col gap-4">
          <Progress value={percent} className="gap-2">
            <div className="flex items-center justify-between gap-3">
              <ProgressLabel className="text-[0.625rem] text-muted-foreground">
                Progress
              </ProgressLabel>
              <span className="text-[0.7rem] text-foreground">
                {summary.completedTasks}/{summary.totalTasks} tasks
              </span>
            </div>
          </Progress>
        </PlatformEntityCardContent>
      ) : (
        <PlatformEntityCardContent>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
            {liveUrl ? (
              <>
                <ProductLiveUrlLink url={liveUrl} />
                <span className="text-muted-foreground" aria-hidden>
                  &middot;
                </span>
              </>
            ) : null}
            {createdAt ? <ProductRelativeTime date={createdAt} /> : null}
          </div>
        </PlatformEntityCardContent>
      )}

      <CardLinkOverlay href={href} label={`View ${name}`} className={cn(summary ? "rounded-none" : undefined)} />
    </PlatformEntityCard>
  );
}

export function ProductListCard({ product }: { product: Product }) {
  return (
    <ProductCard
      href={`/products/${product.id}`}
      name={product.name}
      description={product.description}
      status={product.status}
      liveUrl={product.live_url}
      createdAt={product.created_at}
    />
  );
}
