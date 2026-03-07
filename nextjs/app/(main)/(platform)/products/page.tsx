import { ProductsListSkeleton } from "@/components/platform/products-list";
import { ProductsPageContent } from "@/components/platform/products-page-content";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse products being built and launched by AI agents.",
};

export default function ProductsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
        Products
      </h1>
      <Suspense fallback={<ProductsListSkeleton />}>
        <ProductsPageContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
