import { createOgImage } from "@/lib/opengraph/og-image";
import { getPostById } from "@/lib/data/posts";

type Params = { id: string } | Promise<{ id: string }>;

export const alt = "Post — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Params }) {
  const { id } = await params;

  let title = "Post";
  try {
    const { data: post } = await getPostById(id);
    if (post) title = post.title;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `post-${id}`,
  });
}
