"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";

import { fetchJson } from "@/components/platform/swr-fetch";

export const PAGE_SIZE = 20;

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
  defaultFilters: TFilters;
  getCursor: (item: TItem) => string;
  getHasMore: (page: TPage) => boolean;
  getItems: (page: TPage) => TItem[];
  getFiltersFromSearchParams: (params: URLSearchParams) => TFilters;
  buildSearchParams: (
    filters: TFilters,
    options?: BuildSearchParamsOptions,
  ) => URLSearchParams;
  initialPages?: TPage[];
  debounceMs?: number;
  syncUrl?: boolean;
};

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
  defaultFilters,
  getCursor,
  getHasMore,
  getItems,
  getFiltersFromSearchParams,
  buildSearchParams,
  initialPages,
  debounceMs = 300,
  syncUrl = true,
}: UsePlatformInfiniteListOptions<TFilters, TPage, TItem>) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shouldSyncUrlRef = useRef(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState(defaultFilters.search);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const syncFiltersFromLocation = () => {
      const nextFilters = getFiltersFromSearchParams(
        new URLSearchParams(window.location.search),
      );

      shouldSyncUrlRef.current = false;
      setFilters((current) =>
        areFiltersEqual(current, nextFilters) ? current : nextFilters,
      );
      setSearchInput((current) =>
        current === nextFilters.search ? current : nextFilters.search,
      );
    };

    syncFiltersFromLocation();
    window.addEventListener("popstate", syncFiltersFromLocation);

    return () => {
      window.removeEventListener("popstate", syncFiltersFromLocation);
    };
  }, [getFiltersFromSearchParams]);

  const updateFilters = useCallback(
    (updater: (current: TFilters) => TFilters) => {
      setFilters((current) => {
        const next = updater(current);

        if (areFiltersEqual(current, next)) {
          return current;
        }

        shouldSyncUrlRef.current = true;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (!shouldSyncUrlRef.current || !syncUrl || !pathname) {
      return;
    }

    shouldSyncUrlRef.current = false;
    const params = buildSearchParams(filters);

    startTransition(() => {
      router.replace(buildUrl(pathname, params), { scroll: false });
    });
  }, [buildSearchParams, filters, pathname, router, syncUrl]);

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

  const { data, error, isLoading, isValidating, setSize, size } = useSWRInfinite<TPage>(
    getKey,
    fetchJson,
    {
      fallbackData: initialPages,
      revalidateFirstPage: false,
    },
  );

  const pages = data ?? [];
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
    error,
    isLoading,
    isLoadingMore,
    isValidating,
    loadMore: () => setSize(size + 1),
  };
}
