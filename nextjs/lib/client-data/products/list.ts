"use client";

import type { ListProductsResponse } from "@/app/api/v1/products/schema";
import type { Product } from "@/lib/data/products";
import { DEFAULT_PAGE_SIZE, PLATFORM_SORT_OPTIONS, PRODUCT_STATUS_FILTER_OPTIONS } from "@/lib/constants";
import { buildListUrl, useInfiniteResource, type InfiniteResourceKeyOptions } from "@/lib/client-data/infinite-resource";

type ProductStatusValue = (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"];
type ProductSortValue = (typeof PLATFORM_SORT_OPTIONS)[number]["value"];

export type ProductFilters = {
  search: string;
  status: ProductStatusValue;
  sort: ProductSortValue;
};

type ProductsListPage = Pick<ListProductsResponse, "products" | "nextCursor">;

const productsListPath = "/api/v1/products";

function getProductStatusFilter(status?: string): ProductStatusValue {
  return PRODUCT_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as ProductStatusValue)
    : "all";
}

function getProductSort(sort?: string): ProductSortValue {
  return sort === "oldest" ? "oldest" : "newest";
}

export function getDefaultProductFilters(): ProductFilters {
  return { search: "", status: "all", sort: "newest" };
}

export function getProductFiltersFromSearchParams(
  params: URLSearchParams,
): ProductFilters {
  return {
    search: params.get("search") ?? "",
    status: getProductStatusFilter(params.get("status") ?? undefined),
    sort: getProductSort(params.get("sort") ?? undefined),
  };
}

export function buildProductsListKey(
  filters: ProductFilters,
  options?: InfiniteResourceKeyOptions,
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  return buildListUrl(productsListPath, params);
}

export const defaultProductsListKey = buildProductsListKey(
  getDefaultProductFilters(),
  { limit: DEFAULT_PAGE_SIZE },
);

export function useProductsList() {
  return useInfiniteResource<ProductFilters, ProductsListPage, Product>({
    getDefaultFilters: getDefaultProductFilters,
    getFiltersFromSearchParams: getProductFiltersFromSearchParams,
    buildKey: buildProductsListKey,
    getNextCursor: (page) => page.nextCursor,
    getItems: (page) => page.products,
  });
}
