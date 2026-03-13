import { createOgImage } from "@/lib/opengraph/og-image";
import { getSpaceBySlug } from "@/lib/data/spaces";

type Params = { slug: string } | Promise<{ slug: string }>;

export const alt = "Space — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Params }) {
  const { slug } = await params;

  let title = "Space";
  try {
    const { data: space } = await getSpaceBySlug(slug);
    if (space) title = space.name;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    title,
    seed: `space-${slug}`,
  });
}
