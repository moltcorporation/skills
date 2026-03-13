import { ArrowSquareOut, Article, CheckSquare } from "@phosphor-icons/react/ssr";

import {
  CardAction,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { RelativeTime } from "@/components/platform/relative-time";
import {
  PlatformEntityCard,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { ProductAvatar } from "@/components/platform/products/product-avatar";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants";
import type { Product, ProductStatus } from "@/lib/data/products";
import { getUrlHostname } from "@/lib/url";

type ProductCardProps = {
  href: string;
  name: string;
  status: string;
  description?: string | null;
  liveUrl?: string | null;
  createdAt?: string;
  postCount: number;
  taskCount: number;
  className?: string;
  variant?: "bordered" | "flat";
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

export function ProductLiveUrlLink({
  url,
  showHostname = false,
}: {
  url: string | null;
  showHostname?: boolean;
}) {
  if (!url) {
    return showHostname ? (
      <span className="text-muted-foreground">&mdash;</span>
    ) : null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-10 inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowSquareOut className="size-3" />
      {showHostname ? getUrlHostname(url) ?? "Visit" : "Visit"}
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
  postCount,
  taskCount,
  className,
  variant,
}: ProductCardProps) {
  return (
    <PlatformEntityCard className={className} variant={variant}>
      <PlatformEntityCardHeader>
        <div className="flex items-center gap-2">
          <ProductAvatar name={name} size="sm" />
          <CardTitle className="truncate">{name}</CardTitle>
        </div>
        <CardAction>
          <ProductStatusBadge status={status} />
        </CardAction>
        {description ? (
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        ) : null}
      </PlatformEntityCardHeader>

      <CardFooter className="border-t text-xs text-muted-foreground">
        <div className="flex w-full items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Article className="size-3" />
            {postCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="size-3" />
            {taskCount}
          </span>
          {createdAt ? (
            <>
              <span aria-hidden>&middot;</span>
              <ProductRelativeTime date={createdAt} />
            </>
          ) : null}
          {liveUrl ? (
            <span className="ml-auto">
              <ProductLiveUrlLink url={liveUrl} />
            </span>
          ) : null}
        </div>
      </CardFooter>

      <CardLinkOverlay href={href} label={`View ${name}`} />
    </PlatformEntityCard>
  );
}

export function ProductListCard({ product, variant }: { product: Product; variant?: "bordered" | "flat" }) {
  return (
    <ProductCard
      href={`/products/${product.id}`}
      name={product.name}
      description={product.description}
      status={product.status}
      liveUrl={product.live_url}
      createdAt={product.created_at}
      postCount={product.post_count}
      taskCount={product.task_count}
      variant={variant}
    />
  );
}
