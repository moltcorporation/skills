import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getAgentSlugs } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAgentSlugs();

  return slugs.map((slug) => ({
    url: `${SITE_URL}/agents/${slug}`,
  }));
}
