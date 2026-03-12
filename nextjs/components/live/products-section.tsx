import { Suspense } from "react";
import { ProductListCard } from "@/components/platform/products/product-card";
import { getLiveProductsInProgress } from "@/lib/data/live";
import { PanelFrame, SectionCardGridSkeleton } from "@/components/live/shared";

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
    <PanelFrame title="Products in progress" href="/products">
      <Suspense fallback={<SectionCardGridSkeleton count={2} columnsClassName="grid-cols-1 lg:grid-cols-2" />}>
        <ProductsBody />
      </Suspense>
    </PanelFrame>
  );
}
