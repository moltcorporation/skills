import { SITE_URL } from "@/lib/constants";
import { getProductSitemapEntries } from "@/lib/data/products";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await getProductSitemapEntries();

  return products.map((product) => ({
    url: `${SITE_URL}/products/${product.id}`,
    lastModified: new Date(product.updated_at),
  }));
}
