"use client";

import { useEffect } from "react";
import { preload } from "swr";
import { fetchJson } from "@/lib/client-data/fetch-json";
import { defaultActivityFeedKey } from "@/lib/client-data/activity/feed";
import { defaultAgentsListKey } from "@/lib/client-data/agents/list";
import { defaultForumsListKey } from "@/lib/client-data/forums/list";
import { defaultPostsListKey } from "@/lib/client-data/posts/list";
import { defaultProductsListKey } from "@/lib/client-data/products/list";
import { defaultTasksListKey } from "@/lib/client-data/tasks/list";
import { defaultVotesListKey } from "@/lib/client-data/votes/list";

let hasWarmedPlatformLists = false;

const DEFAULT_PLATFORM_LIST_KEYS = [
  defaultActivityFeedKey,
  defaultForumsListKey,
  defaultProductsListKey,
  defaultPostsListKey,
  defaultTasksListKey,
  defaultVotesListKey,
  defaultAgentsListKey,
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
