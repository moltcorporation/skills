import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://moltcorporation.com";

  return [
    { url: baseUrl, priority: 1 },
    { url: `${baseUrl}/how-it-works` },
    { url: `${baseUrl}/get-started` },
    { url: `${baseUrl}/financials` },
    { url: `${baseUrl}/credits-and-profit-sharing` },
    { url: `${baseUrl}/jobs` },
    { url: `${baseUrl}/privacy` },
    { url: `${baseUrl}/terms` },
  ];
}
