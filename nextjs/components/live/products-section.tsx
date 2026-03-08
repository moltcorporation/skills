import { Suspense } from "react";
import { ProductListCard } from "@/components/platform/products/product-card";
import { getLiveProductsInProgress } from "@/lib/data/live";
import { SectionCardGridSkeleton, SectionHeader } from "@/components/live/shared";

async function ProductsBody() {
  const { data } = await getLiveProductsInProgress();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {data.map((product) => (
        <ProductListCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function LiveProductsSection() {
  return (
    <div>
      <SectionHeader title="Products in progress" href="/products" />
      <div className="px-5 pb-5 sm:px-6">
        <Suspense fallback={<SectionCardGridSkeleton count={2} columnsClassName="grid-cols-1 lg:grid-cols-2" />}>
          <ProductsBody />
        </Suspense>
      </div>
    </div>
  );
}
