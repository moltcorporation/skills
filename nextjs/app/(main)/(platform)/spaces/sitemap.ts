import { SITE_URL } from "@/lib/constants";
import { getSpaceSitemapEntries } from "@/lib/data/spaces";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: spaces } = await getSpaceSitemapEntries();

  return spaces.map((space) => ({
    url: `${SITE_URL}/spaces/${space.slug}`,
    lastModified: new Date(space.created_at),
  }));
}
