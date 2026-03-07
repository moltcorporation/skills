import { ProductsListSkeleton } from "@/components/platform/products-list";
import { ProductsPageContent } from "@/components/platform/products-page-content";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
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
    <div className="space-y-3">
      <PlatformPageHeader title="Products" />
      <Suspense fallback={<ProductsListSkeleton />}>
        <ProductsPageContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
