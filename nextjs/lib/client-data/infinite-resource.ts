"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { fetchJson } from "@/lib/client-data/fetch-json";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ======================================================
// Types
// ======================================================

export type InfiniteResourceFilters = {
  search: string;
};

export type InfiniteResourceKeyOptions = {
  after?: string;
  limit?: number;
};

type InfiniteResourceDefinition<
  TFilters extends InfiniteResourceFilters,
  TPage,
  TItem,
> = {
  getDefaultFilters: () => TFilters;
  getFiltersFromSearchParams: (params: URLSearchParams) => TFilters;
  buildKey: (filters: TFilters, options?: InfiniteResourceKeyOptions) => string;
  getNextCursor: (page: TPage) => string | null;
  getItems: (page: TPage) => TItem[];
};

type UseInfiniteResourceInput<
  TFilters extends InfiniteResourceFilters,
  TPage,
  TItem,
> = InfiniteResourceDefinition<TFilters, TPage, TItem> & {
  initialData?: TPage[];
  debounceMs?: number;
};

// ======================================================
// Helpers
// ======================================================

export function buildListUrl(pathname: string, params: URLSearchParams) {
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

// ======================================================
// UseInfiniteResource
// ======================================================

export function useInfiniteResource<
  TFilters extends InfiniteResourceFilters,
  TPage,
  TItem,
>({
  getDefaultFilters,
  getFiltersFromSearchParams,
  buildKey,
  getNextCursor,
  getItems,
  initialData,
  debounceMs = 300,
}: UseInfiniteResourceInput<TFilters, TPage, TItem>) {
  const pathname = usePathname();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shouldSyncUrlRef = useRef(false);
  const defaultFilters = getDefaultFilters();
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
    if (!shouldSyncUrlRef.current) {
      return;
    }

    shouldSyncUrlRef.current = false;
    const nextKey = buildKey(filters);
    const [, query = ""] = nextKey.split("?");
    const nextSearch = query ? `?${query}` : "";

    startTransition(() => {
      router.replace(`${pathname}${nextSearch}`, { scroll: false });
    });
  }, [buildKey, filters, pathname, router]);

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
      if (previousPageData && getNextCursor(previousPageData) === null) {
        return null;
      }

      const options: InfiniteResourceKeyOptions = { limit: DEFAULT_PAGE_SIZE };

      if (pageIndex > 0) {
        const cursor = getNextCursor(previousPageData as TPage);
        if (cursor) {
          options.after = cursor;
        }
      }

      return buildKey(filters, options);
    },
    [buildKey, filters, getNextCursor],
  );

  const { data, error, isLoading, isValidating, setSize, size } = useSWRInfinite<TPage>(
    getKey,
    fetchJson,
    {
      fallbackData: initialData,
      revalidateFirstPage: false,
    },
  );

  const pages = data ?? [];
  const items = pages.flatMap((page) => getItems(page));
  const lastPage = pages[pages.length - 1];
  const hasMore = lastPage ? getNextCursor(lastPage) !== null : false;
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
