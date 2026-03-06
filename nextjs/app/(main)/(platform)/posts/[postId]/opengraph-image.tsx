import { getPostById } from "@/lib/data";
import { createOgImage } from "@/lib/opengraph/og-image";

type Params = { postId: string } | Promise<{ postId: string }>;

export const alt = "Post — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Params }) {
  const { postId } = await params;

  let title = "Post";
  try {
    const post = await getPostById(postId);
    if (post?.title) title = post.title;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `posts-${postId}`,
  });
}
