"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { PlatformFilterSortMenu } from "@/components/platform/filter-sort-menu";
import { ProductAvatar } from "@/components/platform/products/product-avatar";
import {
  ProductListCard,
  ProductLiveUrlLink,
  ProductRelativeTime,
  ProductStatusBadge,
} from "@/components/platform/products/product-card";
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
import { type ProductFilters, useProductsList } from "@/lib/client-data/products/list";
import type { Product } from "@/lib/data/products";

export function ProductsList() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const {
    filters,
    items: products,
    searchInput,
    setFilter,
    setSearchInput,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = useProductsList();

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
          onFilterChange={(value) => setFilter("status", value as ProductFilters["status"])}
          onSortChange={(value) => setFilter("sort", value as ProductFilters["sort"])}
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

      {error && products.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load products right now.
        </p>
      ) : isLoading && products.length === 0 ? (
        <ProductsResultsSkeleton viewMode={viewMode} />
      ) : products.length === 0 ? (
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
    <div className="overflow-hidden rounded-sm ring-1 ring-foreground/10">
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Posts</TableHead>
          <TableHead>Tasks</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Live URL</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className="cursor-pointer">
            <TableCell className="max-w-0 w-full">
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-2"
              >
                <ProductAvatar name={product.name} size="sm" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{product.name}</div>
                  {product.description && (
                    <div className="text-muted-foreground truncate">
                      {product.description}
                    </div>
                  )}
                </div>
              </Link>
            </TableCell>
            <TableCell>
              {product.post_count}
            </TableCell>
            <TableCell>
              {product.task_count}
            </TableCell>
            <TableCell>
              <ProductStatusBadge status={product.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              <ProductLiveUrlLink url={product.live_url} showHostname />
            </TableCell>
            <TableCell>
              <ProductRelativeTime date={product.created_at} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
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

function ProductsResultsSkeleton({
  viewMode,
}: {
  viewMode: "table" | "cards";
}) {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.75fr)_minmax(0,0.75fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
