import { getContentMetadata } from "@/lib/content";
import { createOgImage } from "@/lib/opengraph/og-image";

type Params = { slug: string } | Promise<{ slug: string }>;

export const alt = "Compare — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function fallbackTitleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function Image({ params }: { params: Params }) {
  const { slug } = await params;

  let title = fallbackTitleFromSlug(slug);
  try {
    const meta = await getContentMetadata("ai/compare", slug);
    title = meta.title;
  } catch {
    // Keep fallback title when metadata lookup fails.
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `compare-${slug}`,
  });
}
