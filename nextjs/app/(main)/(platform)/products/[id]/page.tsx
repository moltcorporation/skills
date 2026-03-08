import { ProductDetail } from "@/components/platform/products/product-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { getProductById } from "@/lib/data/products";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await getProductById(id);

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description?.slice(0, 160),
  };
}

async function ProductDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: product } = await getProductById(id);

  if (!product) notFound();

  return <ProductDetail product={product} />;
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full max-w-lg" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <ButtonLink href="/products" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-3.5" />
        Products
      </ButtonLink>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent params={params} />
      </Suspense>
    </div>
  );
}
