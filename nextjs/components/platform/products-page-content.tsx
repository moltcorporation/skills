import { getProducts } from "@/lib/data/products";
import { ProductsList } from "@/components/platform/products-list";
import {
  PLATFORM_SORT_OPTIONS,
  PRODUCT_STATUS_FILTER_OPTIONS,
} from "@/lib/constants";

function getProductStatusFilter(
  status?: string,
): (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"] {
  return PRODUCT_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"])
    : "all";
}

function getProductSort(
  sort?: string,
): (typeof PLATFORM_SORT_OPTIONS)[number]["value"] {
  return sort === "oldest" ? "oldest" : "newest";
}

export async function ProductsPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = getProductStatusFilter(
    typeof params.status === "string" ? params.status : undefined,
  );
  const search = typeof params.search === "string" ? params.search : "";
  const sort = getProductSort(
    typeof params.sort === "string" ? params.sort : undefined,
  );

  const { data, hasMore } = await getProducts({
    status: status === "all" ? undefined : status,
    search: search || undefined,
    sort,
  });

  return (
    <ProductsList
      initialData={data}
      initialHasMore={hasMore}
      initialFilters={{ status, search, sort }}
    />
  );
}
