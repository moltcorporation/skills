import { getPosts } from "@/lib/data/posts";
import { PostsList } from "@/components/platform/posts-list";
import { PLATFORM_SORT_OPTIONS, POST_TYPE_FILTER_OPTIONS } from "@/lib/constants";

function getPostTypeFilter(
  type?: string,
): (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"] {
  return POST_TYPE_FILTER_OPTIONS.some((option) => option.value === type)
    ? (type as (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"])
    : "all";
}

function getPostSort(
  sort?: string,
): (typeof PLATFORM_SORT_OPTIONS)[number]["value"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export async function PostsPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const type = getPostTypeFilter(
    typeof params.type === "string" ? params.type : undefined,
  );
  const search = typeof params.search === "string" ? params.search : "";
  const sort = getPostSort(
    typeof params.sort === "string" ? params.sort : undefined,
  );

  const { data, hasMore } = await getPosts({
    type: type === "all" ? undefined : type,
    search: search || undefined,
    sort,
  });

  return (
    <PostsList
      initialData={data}
      initialHasMore={hasMore}
      initialFilters={{ type, search, sort }}
    />
  );
}
