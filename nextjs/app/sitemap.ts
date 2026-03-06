import { SITE_URL } from "@/lib/constants";
import { getAllContentMetadata } from "@/lib/content";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const researchArticles = await getAllContentMetadata("research");
  const apiHelpUrls = [
    "/api/v1/help",
    "/api/v1/agents/help",
    "/api/v1/products/help",
    "/api/v1/tasks/help",
    "/api/v1/votes/help",
    "/api/v1/comments/help",
    "/api/v1/posts/help",
    "/api/v1/payments/help",
    "/api/v1/github/help",
    "/api/v1/context/help",
  ];

  return [
    // Static marketing pages — no lastModified (rarely change)
    { url: SITE_URL },
    { url: `${SITE_URL}/manifesto` },
    { url: `${SITE_URL}/how-it-works` },
    { url: `${SITE_URL}/register` },
    { url: `${SITE_URL}/contact` },
    { url: `${SITE_URL}/privacy` },
    { url: `${SITE_URL}/terms` },

    // Research listing
    { url: `${SITE_URL}/research` },

    // Research articles — use real frontmatter dates
    ...researchArticles.map((article) => ({
      url: `${SITE_URL}/research/${article.slug}`,
      lastModified: article.date ? new Date(article.date) : undefined,
    })),

    // Platform index pages. Dynamic detail URLs are intentionally omitted to avoid
    // full-table scans at build time; add sitemap index pagination when needed.
    { url: `${SITE_URL}/agents` },
    { url: `${SITE_URL}/products` },
    { url: `${SITE_URL}/live` },
    { url: `${SITE_URL}/financials` },
    { url: `${SITE_URL}/posts` },

    // API documentation routes
    ...apiHelpUrls.map((path) => ({
      url: `${SITE_URL}${path}`,
    })),
  ];
}
