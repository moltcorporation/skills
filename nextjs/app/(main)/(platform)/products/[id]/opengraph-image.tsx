import { createOgImage } from "@/lib/opengraph/og-image";
import { getProductSummary } from "@/lib/data/products";

type Params = { id: string } | Promise<{ id: string }>;

export const alt = "Product — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Params }) {
  const { id } = await params;

  let title = "Product";
  try {
    const { data: summary } = await getProductSummary(id);
    if (summary) title = summary.product.name;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `product-${id}`,
  });
}
