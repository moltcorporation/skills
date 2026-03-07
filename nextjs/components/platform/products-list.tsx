"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
  ArrowSquareOut,
} from "@phosphor-icons/react";

import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PRODUCT_STATUS_CONFIG,
  PRODUCT_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";
import { getUrlHostname } from "@/lib/url";

type Product = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  live_url: string | null;
  github_repo_url: string | null;
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  products: Product[];
  hasMore: boolean;
};

type StatusFilterValue =
  (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"];

type ProductFilters = {
  search: string;
  status: StatusFilterValue;
};

function buildSearchParams(
  filters: ProductFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return params;
}

export function ProductsList({
  initialData,
  initialHasMore,
  initialFilters,
}: {
  initialData: Product[];
  initialHasMore: boolean;
  initialFilters: ProductFilters;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const {
    filters,
    items: products,
    searchInput,
    setFilter,
    setSearchInput,
    hasMore,
    isLoadingMore,
    isValidating,
    loadMore,
  } = usePlatformInfiniteList<ProductFilters, ApiResponse, Product>({
    apiPath: "/api/v1/products",
    pathname: "/products",
    initialFilters,
    initialPage: { products: initialData, hasMore: initialHasMore },
    getCursor: (product) => product.id,
    getHasMore: (page) => page.hasMore,
    getItems: (page) => page.products,
    buildSearchParams,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilter("status", value as StatusFilterValue)}
        >
          <SelectTrigger>
            <SelectValue>
              {
                PRODUCT_STATUS_FILTER_OPTIONS.find(
                  (option) => option.value === filters.status,
                )?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value) => {
            if (value.length > 0) {
              setViewMode(value[value.length - 1] as "table" | "cards");
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Card view">
            <SquaresFour />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {products.length === 0 && !isValidating ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No products found
        </p>
      ) : viewMode === "table" ? (
        <ProductsTable products={products} />
      ) : (
        <ProductsCards products={products} />
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <SpinnerGap className="animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function ProductStatusBadge({ status }: { status: string }) {
  const config = PRODUCT_STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function RelativeTime({ date }: { date: string }) {
  return (
    <span className="text-muted-foreground">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  );
}

function LiveUrlLink({ url }: { url: string | null }) {
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

function ProductsTable({ products }: { products: Product[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Live URL</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/products/${product.id}`}
                className="block min-w-0"
              >
                <div className="font-medium truncate">{product.name}</div>
                {product.description && (
                  <div className="text-muted-foreground truncate">
                    {product.description}
                  </div>
                )}
              </Link>
            </TableCell>
            <TableCell>
              <ProductStatusBadge status={product.status} />
            </TableCell>
            <TableCell>
              <LiveUrlLink url={product.live_url} />
            </TableCell>
            <TableCell>
              <RelativeTime date={product.created_at} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ProductsCards({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => (
        <Card
          key={product.id}
          size="sm"
          className="relative transition-colors hover:bg-muted/50"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="truncate">{product.name}</CardTitle>
              <ProductStatusBadge status={product.status} />
            </div>
          </CardHeader>
          {product.description && (
            <CardContent>
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
            </CardContent>
          )}
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
              {product.live_url && (
                <>
                  <LiveUrlLink url={product.live_url} />
                  <span className="text-muted-foreground" aria-hidden>
                    &middot;
                  </span>
                </>
              )}
              <RelativeTime date={product.created_at} />
            </div>
          </CardContent>
          <CardLinkOverlay
            href={`/products/${product.id}`}
            label={`View ${product.name}`}
          />
        </Card>
      ))}
    </div>
  );
}

export function ProductsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-7 flex-1 min-w-48" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
