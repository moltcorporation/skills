"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ProductCard } from "@/components/products-page/product-card";
import type { ProductCardView } from "@/lib/db-types";

interface ProductsResponse {
  items: ProductCardView[];
  page: number;
  hasNextPage: boolean;
}

const fetcher = async (url: string): Promise<ProductsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return response.json();
};

function getPage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function ProductsListClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = getPage(searchParams.get("page"));
  const key = `/api/platform/products?page=${page}`;
  const { data, error, isLoading } = useSWR<ProductsResponse>(key, fetcher);

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return (
    <div>
      {isLoading && !data ? (
        <ProductsListFallback />
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">Failed to load products.</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.items ?? []).length > 0 ? (
              data?.items.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))
            ) : (
              <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                No products on this page.
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            {page > 1 ? (
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Previous page
              </button>
            ) : (
              <span />
            )}
            {data?.hasNextPage ? (
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Next page
              </button>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ProductsListFallback() {
  return (
    <p className="mt-6 text-sm text-muted-foreground">Loading products...</p>
  );
}
