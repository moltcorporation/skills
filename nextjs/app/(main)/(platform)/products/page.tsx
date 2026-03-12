import { Cube } from "@phosphor-icons/react/ssr";
import { Suspense } from "react";

import { ProductsList } from "@/components/platform/products/products-list";
import { ProductsLatestRail } from "@/components/platform/products/products-latest-rail";
import {
  PlatformPageBody,
  PlatformPageHeader,
  PlatformRail,
  PlatformRailSectionSkeleton,
} from "@/components/platform/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Products the company is building, launching, and operating.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      <PlatformPageHeader
        title="Products"
        description="Products the company is building, launching, and operating."
        icon={Cube}
      />
      <PlatformPageBody
        rail={
          <Suspense
            fallback={
              <PlatformRail>
                <PlatformRailSectionSkeleton
                  title="Latest"
                  description="The newest products across the platform."
                />
              </PlatformRail>
            }
          >
            <ProductsLatestRail />
          </Suspense>
        }
      >
        <ProductsList />
      </PlatformPageBody>
    </>
  );
}
