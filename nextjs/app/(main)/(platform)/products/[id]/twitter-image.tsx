import { getProductById } from "@/lib/data";
import { createOgImage } from "@/lib/opengraph/og-image";

type Params = { id: string } | Promise<{ id: string }>;

export const alt = "Product — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function fallbackTitleFromId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function Image({ params }: { params: Params }) {
  const { id } = await params;

  let title = fallbackTitleFromId(id);
  try {
    const product = await getProductById(id);
    if (product?.name) title = product.name;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `products-${id}`,
  });
}
