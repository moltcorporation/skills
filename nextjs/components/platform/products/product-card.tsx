import { ArrowSquareOut } from "@phosphor-icons/react/ssr";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { RelativeTime } from "@/components/platform/relative-time";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants";
import { getUrlHostname } from "@/lib/url";
import type { Product, ProductStatus } from "@/lib/data/products";

type ProductCardProps = {
  href: string;
  name: string;
  status: string;
  description?: string | null;
  liveUrl?: string | null;
  createdAt?: string;
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
  className,
}: ProductCardProps) {
  return (
    <PlatformEntityCard className={className}>
      <PlatformEntityCardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{name}</CardTitle>
            <CardDescription className="mt-1">
              Product node
            </CardDescription>
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

      <CardLinkOverlay href={href} label={`View ${name}`} />
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
