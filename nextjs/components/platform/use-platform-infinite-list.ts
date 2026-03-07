"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";

const PAGE_SIZE = 20;

type PlatformListFilters = {
  search: string;
};

type BuildSearchParamsOptions = {
  after?: string;
  limit?: number;
};

type UsePlatformInfiniteListOptions<
  TFilters extends PlatformListFilters,
  TPage,
  TItem,
> = {
  apiPath: string;
  pathname?: string;
  initialFilters: TFilters;
  initialPage: TPage;
  getCursor: (item: TItem) => string;
  getHasMore: (page: TPage) => boolean;
  getItems: (page: TPage) => TItem[];
  buildSearchParams: (
    filters: TFilters,
    options?: BuildSearchParamsOptions,
  ) => URLSearchParams;
  debounceMs?: number;
  syncUrl?: boolean;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function buildUrl(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function areFiltersEqual<TFilters extends Record<string, string>>(
  left: TFilters,
  right: TFilters,
) {
  const keys = Object.keys(left) as (keyof TFilters)[];

  if (keys.length !== Object.keys(right).length) {
    return false;
  }

  return keys.every((key) => left[key] === right[key]);
}

export function usePlatformInfiniteList<
  TFilters extends PlatformListFilters,
  TPage,
  TItem,
>({
  apiPath,
  pathname,
  initialFilters,
  initialPage,
  getCursor,
  getHasMore,
  getItems,
  buildSearchParams,
  debounceMs = 300,
  syncUrl = true,
}: UsePlatformInfiniteListOptions<TFilters, TPage, TItem>) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search);

  // Server-rendered filters remain the canonical state for reloads and navigation.
  useEffect(() => {
    setFilters(initialFilters);
    setSearchInput(initialFilters.search);
  }, [initialFilters]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const replaceUrl = useCallback(
    (nextFilters: TFilters) => {
      if (!syncUrl || !pathname) {
        return;
      }

      const params = buildSearchParams(nextFilters);

      startTransition(() => {
        router.replace(buildUrl(pathname, params), { scroll: false });
      });
    },
    [buildSearchParams, pathname, router, syncUrl],
  );

  const updateFilters = useCallback(
    (updater: (current: TFilters) => TFilters) => {
      setFilters((current) => {
        const next = updater(current);

        if (areFiltersEqual(current, next)) {
          return current;
        }

        replaceUrl(next);
        return next;
      });
    },
    [replaceUrl],
  );

  useEffect(() => {
    if (searchInput === filters.search) {
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const nextSearch = searchInput.trim();

      updateFilters((current) => ({
        ...current,
        search: nextSearch,
      }));
    }, debounceMs);

    return () => clearTimeout(debounceRef.current);
  }, [debounceMs, filters.search, searchInput, updateFilters]);

  const setFilter = useCallback(
    <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
      updateFilters((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [updateFilters],
  );

  const getKey = useCallback(
    (pageIndex: number, previousPageData: TPage | null) => {
      if (previousPageData && !getHasMore(previousPageData)) {
        return null;
      }

      const params = buildSearchParams(filters, { limit: PAGE_SIZE });

      if (pageIndex > 0) {
        const previousItems = getItems(previousPageData as TPage);
        const lastItem = previousItems[previousItems.length - 1];

        if (lastItem) {
          params.set("after", getCursor(lastItem));
        }
      }

      return buildUrl(apiPath, params);
    },
    [apiPath, buildSearchParams, filters, getCursor, getHasMore, getItems],
  );

  const { data, isValidating, setSize, size } = useSWRInfinite<TPage>(
    getKey,
    fetchJson,
    {
      fallbackData: [initialPage],
      revalidateFirstPage: false,
    },
  );

  const pages =
    data ?? (areFiltersEqual(filters, initialFilters) ? [initialPage] : []);
  const items = pages.flatMap((page) => getItems(page));
  const lastPage = pages[pages.length - 1];
  const hasMore = lastPage ? getHasMore(lastPage) : false;
  const isLoadingMore = isValidating && size > 1 && pages.length < size;

  return {
    filters,
    searchInput,
    setFilter,
    setSearchInput,
    items,
    hasMore,
    isLoadingMore,
    isValidating,
    loadMore: () => setSize(size + 1),
  };
}
