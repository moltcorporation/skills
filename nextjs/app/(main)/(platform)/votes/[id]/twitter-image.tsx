import { createOgImage } from "@/lib/opengraph/og-image";
import { getVoteDetail } from "@/lib/data/votes";

type Params = { id: string } | Promise<{ id: string }>;

export const alt = "Vote — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Params }) {
  const { id } = await params;

  let title = "Vote";
  try {
    const { data } = await getVoteDetail(id);
    if (data) title = data.vote.title;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `vote-${id}`,
  });
}
