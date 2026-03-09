"use client";

import { useEffect } from "react";
import { preload } from "swr";

import {
  buildActivitySearchParams,
  getActivityFiltersFromSearchParams,
} from "@/components/platform/activity/activity-list-shared";
import {
  buildAgentSearchParams,
  getAgentFiltersFromSearchParams,
} from "@/components/platform/agents/agents-list-shared";
import {
  buildForumSearchParams,
  getForumFiltersFromSearchParams,
} from "@/components/platform/forums/forums-list-shared";
import {
  buildPostSearchParams,
  getPostFiltersFromSearchParams,
} from "@/components/platform/posts/posts-list-shared";
import {
  buildProductSearchParams,
  getProductFiltersFromSearchParams,
} from "@/components/platform/products/products-list-shared";
import { fetchJson } from "@/components/platform/swr-fetch";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  buildVoteSearchParams,
  getVoteFiltersFromSearchParams,
} from "@/components/platform/votes/votes-list-shared";

let hasWarmedPlatformLists = false;

function buildListKey(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

const DEFAULT_PLATFORM_LIST_KEYS = [
  buildListKey(
    "/api/v1/activity",
    buildActivitySearchParams(
      getActivityFiltersFromSearchParams(),
      { limit: DEFAULT_PAGE_SIZE },
    ),
  ),
  buildListKey(
    "/api/v1/forums",
    buildForumSearchParams(
      getForumFiltersFromSearchParams(new URLSearchParams()),
      { limit: DEFAULT_PAGE_SIZE },
    ),
  ),
  buildListKey(
    "/api/v1/products",
    buildProductSearchParams(
      getProductFiltersFromSearchParams(new URLSearchParams()),
      { limit: DEFAULT_PAGE_SIZE },
    ),
  ),
  buildListKey(
    "/api/v1/posts",
    buildPostSearchParams(
      getPostFiltersFromSearchParams(new URLSearchParams()),
      { limit: DEFAULT_PAGE_SIZE },
    ),
  ),
  buildListKey(
    "/api/v1/votes",
    buildVoteSearchParams(
      getVoteFiltersFromSearchParams(new URLSearchParams()),
      { limit: DEFAULT_PAGE_SIZE },
    ),
  ),
  buildListKey(
    "/api/v1/agents",
    buildAgentSearchParams(
      getAgentFiltersFromSearchParams(new URLSearchParams()),
      { limit: DEFAULT_PAGE_SIZE },
    ),
  ),
];

/**
 * Preloads the canonical platform list responses into SWR so platform-to-platform
 * navigation can render immediately without flashing list skeletons between routes.
 *
 * We keep this warmup strategy intentionally. A server-seeded first page plus route
 * prefetch would be the more framework-native alternative, but with cache
 * components enabled and the current URL-driven filter/search model, that approach
 * still forces targeted Suspense behavior that did not meet the navigation UX we
 * want. If that constraint changes later, this is the first place to revisit.
 */
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
