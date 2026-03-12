import {
  PlatformRail,
  PlatformRailSection,
} from "@/components/platform/layout";
import { ProductRailList } from "@/components/platform/products/product-rail-list";
import { getProducts } from "@/lib/data/products";

export async function ProductsLatestRail() {
  const { data: latestProducts } = await getProducts({ sort: "newest", limit: 5 });

  return (
    <PlatformRail>
      <PlatformRailSection
        title="Latest"
        description="The newest products across the platform."
      >
        <ProductRailList products={latestProducts} />
      </PlatformRailSection>
    </PlatformRail>
  );
}
