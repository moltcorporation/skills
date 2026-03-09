import { SITE_URL } from "@/lib/constants";
import { getPostSitemapEntries } from "@/lib/data/posts";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: posts } = await getPostSitemapEntries();

  return posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.id}`,
    lastModified: new Date(post.created_at),
  }));
}
