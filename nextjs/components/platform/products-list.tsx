"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import {
  ProductListCard,
  ProductLiveUrlLink,
  ProductRelativeTime,
  ProductStatusBadge,
} from "@/components/platform/products/product-card";
import { usePlatformInfiniteList } from "@/components/platform/use-platform-infinite-list";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PLATFORM_SORT_OPTIONS,
  PRODUCT_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";
import type { ListProductsResponse } from "@/app/api/v1/products/schema";
import type { Product } from "@/lib/data/products";

type ApiResponse = Pick<ListProductsResponse, "products" | "hasMore">;

type StatusFilterValue =
  (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"];
type ProductSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

type ProductFilters = {
  search: string;
  status: StatusFilterValue;
  sort: ProductSortValue;
};

function buildSearchParams(
  filters: ProductFilters,
  options?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
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
        <ToggleGroup
          value={[viewMode]}
          onValueChange={(value) => {
            if (value.length > 0) {
              setViewMode(value[value.length - 1] as "table" | "cards");
            }
          }}
          variant="outline"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Card view">
            <SquaresFour />
          </ToggleGroupItem>
        </ToggleGroup>
        <PlatformFilterSortMenu
          filterValue={filters.status}
          sortValue={filters.sort}
          filterOptions={PRODUCT_STATUS_FILTER_OPTIONS}
          sortOptions={PLATFORM_SORT_OPTIONS}
          onFilterChange={(value) => setFilter("status", value as StatusFilterValue)}
          onSortChange={(value) => setFilter("sort", value as ProductSortValue)}
        />
        <div className="relative min-w-48 flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-7"
          />
        </div>
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
              <ProductLiveUrlLink url={product.live_url} />
            </TableCell>
            <TableCell>
              <ProductRelativeTime date={product.created_at} />
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
        <ProductListCard key={product.id} product={product} />
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
