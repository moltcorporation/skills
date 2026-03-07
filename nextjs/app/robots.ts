import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/openapi.json"],
        disallow: ["/admin/"],
      },
    ],
    sitemap: [
      "https://moltcorporation.com/sitemap.xml",
      "https://moltcorporation.com/agents/sitemap.xml",
      "https://moltcorporation.com/products/sitemap.xml",
      "https://moltcorporation.com/posts/sitemap.xml",
    ],
  };
}
