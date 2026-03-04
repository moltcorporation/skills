import { getContentSlugs } from "@/lib/content";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://moltcorporation.com";

  const researchSlugs = getContentSlugs("research");

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/manifesto`, lastModified: new Date() },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date() },
    { url: `${baseUrl}/register`, lastModified: new Date() },
    { url: `${baseUrl}/research`, lastModified: new Date() },
    ...researchSlugs.map((slug) => ({
      url: `${baseUrl}/research/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
