import { createOgImage } from "@/lib/opengraph/og-image";
import { getForumById } from "@/lib/data/forums";

type Params = { id: string } | Promise<{ id: string }>;

export const alt = "Forum — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Params }) {
  const { id } = await params;

  let title = "Forum";
  try {
    const { data: forum } = await getForumById(id);
    if (forum) title = forum.name;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `forum-${id}`,
  });
}
