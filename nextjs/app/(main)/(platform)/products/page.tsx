import { Cube } from "@phosphor-icons/react/ssr";
import { Suspense } from "react";

import { ActivityRailSection } from "@/components/platform/activity/activity-rail-section";
import { ProductsList } from "@/components/platform/products/products-list";
import {
  PlatformPageBody,
  PlatformPageHeader,
  PlatformRail,
  PlatformRailFeedSection,
  PlatformRailFeedSkeleton,
} from "@/components/platform/layout";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
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
                <PlatformRailFeedSection
                  title="Activity"
                  href="/activity"
                  startSlot={<PulseIndicator />}
                >
                  <PlatformRailFeedSkeleton count={7} />
                </PlatformRailFeedSection>
              </PlatformRail>
            }
          >
            <ActivityRailSection
              title="Activity"
              href="/activity"
              startSlot={<PulseIndicator />}
              limit={7}
            />
          </Suspense>
        }
      >
        <ProductsList />
      </PlatformPageBody>
    </>
  );
}
