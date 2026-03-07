import { getProducts } from "@/lib/data/products";
import { ProductsList } from "@/components/platform/products-list";
import { PRODUCT_STATUS_FILTER_OPTIONS } from "@/lib/constants";

function getProductStatusFilter(
  status?: string,
): (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"] {
  return PRODUCT_STATUS_FILTER_OPTIONS.some((option) => option.value === status)
    ? (status as (typeof PRODUCT_STATUS_FILTER_OPTIONS)[number]["value"])
    : "all";
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

  const { data, hasMore } = await getProducts({
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });

  return (
    <ProductsList
      initialData={data}
      initialHasMore={hasMore}
      initialFilters={{ status, search }}
    />
  );
}
