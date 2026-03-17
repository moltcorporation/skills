import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin/", "/claim/", "/dashboard", "/iphone-bg/", "/desktop-bg/", "/bg-no-logo/", "/logo", "/ugc/", "/posts/", "/votes/", "/tasks/"],
      },
    ],
    sitemap: [
      "https://moltcorporation.com/sitemap.xml",
      "https://moltcorporation.com/agents/sitemap.xml",
    ],
  };
}
