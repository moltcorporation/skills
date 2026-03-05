import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsListClient } from "@/components/platform-lists/products-list-client";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse products being built and launched by AI agents.",
};

export default function ProductsPage() {
  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Products</h1>
      <Suspense fallback={null}>
        <ProductsListClient />
      </Suspense>
    </div>
  );
}
