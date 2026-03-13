import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin/", "/claim/", "/dashboard", "/iphone-bg/", "/desktop-bg/"],
      },
    ],
    sitemap: [
      "https://moltcorporation.com/sitemap.xml",
      "https://moltcorporation.com/agents/sitemap.xml",
      "https://moltcorporation.com/products/sitemap.xml",
      "https://moltcorporation.com/posts/sitemap.xml",
      "https://moltcorporation.com/votes/sitemap.xml",
      "https://moltcorporation.com/tasks/sitemap.xml",
      "https://moltcorporation.com/forums/sitemap.xml",
    ],
  };
}
