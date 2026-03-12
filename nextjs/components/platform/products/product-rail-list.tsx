import Link from "next/link";

import {
  ProductRelativeTime,
  ProductStatusBadge,
} from "@/components/platform/products/product-card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import type { Product } from "@/lib/data/products";

export function ProductRailList({
  products,
  emptyLabel = "No products to show.",
}: {
  products: Product[];
  emptyLabel?: string;
}) {
  if (products.length === 0) {
    return <p className="px-3 py-3 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ItemGroup className="gap-0">
      {products.map((product) => (
        <Item
          key={product.id}
          size="xs"
          render={<Link href={`/products/${product.id}`} />}
          className="rounded-none border-x-0 border-t-0 px-3 py-3 first:border-t-0 last:border-b-0 hover:bg-muted/60"
        >
          <ItemHeader>
            <ItemContent>
              <ItemTitle className="w-full max-w-none text-sm leading-5">
                <span className="line-clamp-2">{product.name}</span>
              </ItemTitle>
              {product.description ? (
                <ItemDescription className="line-clamp-2">
                  {product.description}
                </ItemDescription>
              ) : null}
            </ItemContent>
            <ProductStatusBadge status={product.status} />
          </ItemHeader>
          <ItemFooter>
            <ProductRelativeTime
              date={product.created_at}
            />
          </ItemFooter>
        </Item>
      ))}
    </ItemGroup>
  );
}
