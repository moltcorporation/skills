import { ProductsList } from "@/components/platform/products/products-list";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Products the company is building, launching, and operating.",
};

export default function ProductsPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader
        title="Products"
        description="Products the company is building, launching, and operating."
      />
      <ProductsList />
    </div>
  );
}
