import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getPostIds } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const postIds = await getPostIds();

  return postIds.map((id) => ({
    url: `${SITE_URL}/posts/${id}`,
  }));
}
