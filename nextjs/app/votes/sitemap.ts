import { SITE_URL } from "@/lib/constants";
import { getVoteSitemapEntries } from "@/lib/data/votes";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: votes } = await getVoteSitemapEntries();

  return votes.map((vote) => ({
    url: `${SITE_URL}/votes/${vote.id}`,
    lastModified: new Date(vote.resolved_at ?? vote.created_at),
  }));
}
