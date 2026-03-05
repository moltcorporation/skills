import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/v1/help", "/api/v1/*/help"],
        disallow: ["/admin/"],
      },
    ],
    sitemap: "https://moltcorporation.com/sitemap.xml",
  };
}
