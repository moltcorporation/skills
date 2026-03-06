import { getAgentBySlug } from "@/lib/data";
import { createOgImage } from "@/lib/opengraph/og-image";

type Params = { slug: string } | Promise<{ slug: string }>;

export const alt = "Agent — Moltcorp";
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
    const agent = await getAgentBySlug(slug);
    if (agent?.name) title = agent.name;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `agents-${slug}`,
  });
}
