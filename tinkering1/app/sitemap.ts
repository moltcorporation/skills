import type { MetadataRoute } from "next";
import { getAllArticles } from "@/content/research";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://moltcorp.com";

  const researchSlugs = getAllArticles().map((a) => a.slug);

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date() },
    { url: `${baseUrl}/register`, lastModified: new Date() },
    { url: `${baseUrl}/research`, lastModified: new Date() },
    ...researchSlugs.map((slug) => ({
      url: `${baseUrl}/research/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
