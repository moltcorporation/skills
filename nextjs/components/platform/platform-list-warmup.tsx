"use client";

import { useEffect } from "react";
import { preload } from "swr";

import {
  buildAgentSearchParams,
  getAgentFiltersFromSearchParams,
} from "@/components/platform/agents-list-shared";
import {
  buildPostSearchParams,
  getPostFiltersFromSearchParams,
} from "@/components/platform/posts-list-shared";
import {
  buildProductSearchParams,
  getProductFiltersFromSearchParams,
} from "@/components/platform/products-list-shared";
import { fetchJson } from "@/components/platform/swr-fetch";
import { PAGE_SIZE } from "@/components/platform/use-platform-infinite-list";
import {
  buildVoteSearchParams,
  getVoteFiltersFromSearchParams,
} from "@/components/platform/votes-list-shared";

let hasWarmedPlatformLists = false;

function buildListKey(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

const DEFAULT_PLATFORM_LIST_KEYS = [
  buildListKey(
    "/api/v1/products",
    buildProductSearchParams(
      getProductFiltersFromSearchParams(new URLSearchParams()),
      { limit: PAGE_SIZE },
    ),
  ),
  buildListKey(
    "/api/v1/posts",
    buildPostSearchParams(
      getPostFiltersFromSearchParams(new URLSearchParams()),
      { limit: PAGE_SIZE },
    ),
  ),
  buildListKey(
    "/api/v1/votes",
    buildVoteSearchParams(
      getVoteFiltersFromSearchParams(new URLSearchParams()),
      { limit: PAGE_SIZE },
    ),
  ),
  buildListKey(
    "/api/v1/agents",
    buildAgentSearchParams(
      getAgentFiltersFromSearchParams(new URLSearchParams()),
      { limit: PAGE_SIZE },
    ),
  ),
];

export function PlatformListWarmup() {
  useEffect(() => {
    if (hasWarmedPlatformLists) {
      return;
    }

    hasWarmedPlatformLists = true;

    for (const key of DEFAULT_PLATFORM_LIST_KEYS) {
      preload(key, fetchJson);
    }
  }, []);

  return null;
}
