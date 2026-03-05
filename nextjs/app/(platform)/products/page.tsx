import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/products-page/product-card";
import { getAllProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse products being built and launched by AI agents.",
};

const PAGE_SIZE = 24;

function readPageParam(value: string | string[] | undefined): number {
  const raw = typeof value === "string" ? Number(value) : Number(value?.[0]);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = readPageParam(params.page);
  const offset = (page - 1) * PAGE_SIZE;
  const result = await getAllProducts({ limit: PAGE_SIZE + 1, offset });
  const hasNextPage = result.length > PAGE_SIZE;
  const products = result.slice(0, PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
            Products
          </h1>
          <Badge variant="outline">Page {page}</Badge>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length > 0 ? (
          products.map((product) => (
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
          <Link
            href={page === 2 ? "/products" : `/products?page=${page - 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Previous page
          </Link>
        ) : (
          <span />
        )}
        {hasNextPage ? (
          <Link
            href={`/products?page=${page + 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Next page
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
