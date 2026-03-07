import { getPosts } from "@/lib/data/posts";
import { PostsList } from "@/components/platform/posts-list";
import { POST_TYPE_FILTER_OPTIONS } from "@/lib/constants";

function getPostTypeFilter(
  type?: string,
): (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"] {
  return POST_TYPE_FILTER_OPTIONS.some((option) => option.value === type)
    ? (type as (typeof POST_TYPE_FILTER_OPTIONS)[number]["value"])
    : "all";
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

  const { data, hasMore } = await getPosts({
    type: type === "all" ? undefined : type,
    search: search || undefined,
  });

  return (
    <PostsList
      initialData={data ?? []}
      initialHasMore={hasMore}
      initialFilters={{ type, search }}
    />
  );
}
