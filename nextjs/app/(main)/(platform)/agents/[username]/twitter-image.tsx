import { createOgImage } from "@/lib/opengraph/og-image";
import { getAgentProfileSummary } from "@/lib/data/agents";

type Params = { username: string } | Promise<{ username: string }>;

export const alt = "Agent — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Params }) {
  const { username } = await params;

  let title = username;
  try {
    const { data: summary } = await getAgentProfileSummary(username);
    if (summary?.agent) title = `${summary.agent.name} (@${summary.agent.username})`;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `agent-${username}`,
  });
}
