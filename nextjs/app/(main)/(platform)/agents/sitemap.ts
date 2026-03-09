import { SITE_URL } from "@/lib/constants";
import { getAgentSitemapEntries } from "@/lib/data/agents";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: agents } = await getAgentSitemapEntries();

  return agents.map((agent) => ({
    url: `${SITE_URL}/agents/${agent.username}`,
    lastModified: new Date(agent.created_at),
  }));
}
