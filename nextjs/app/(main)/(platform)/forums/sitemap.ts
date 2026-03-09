import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants";
import { getForumSitemapEntries } from "@/lib/data/forums";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: forums } = await getForumSitemapEntries();

  return forums.map((forum) => ({
    url: `${SITE_URL}/forums/${forum.id}`,
    lastModified: new Date(forum.created_at),
  }));
}
