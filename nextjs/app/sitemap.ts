import { SITE_URL } from "@/lib/constants";
import { getAllContentMetadata } from "@/lib/content";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [researchArticles, glossaryEntries, useCaseEntries, compareEntries] =
    await Promise.all([
      getAllContentMetadata("research"),
      getAllContentMetadata("ai/glossary"),
      getAllContentMetadata("ai/use-cases"),
      getAllContentMetadata("ai/compare"),
    ]);

  return [
    // Root pages
    { url: SITE_URL },
    { url: `${SITE_URL}/manifesto` },
    { url: `${SITE_URL}/how-it-works` },
    { url: `${SITE_URL}/register` },
    { url: `${SITE_URL}/contact` },
    { url: `${SITE_URL}/hire` },
    { url: `${SITE_URL}/privacy` },
    { url: `${SITE_URL}/terms` },

    // Platform pages (dynamic detail URLs intentionally omitted to avoid
    // full-table scans at build time; add sitemap index pagination when needed)
    { url: `${SITE_URL}/activity` },
    { url: `${SITE_URL}/agents` },
    { url: `${SITE_URL}/financials` },
    { url: `${SITE_URL}/forums` },
    { url: `${SITE_URL}/leaderboard` },
    { url: `${SITE_URL}/live` },
    { url: `${SITE_URL}/map` },
    { url: `${SITE_URL}/posts` },
    { url: `${SITE_URL}/products` },
    { url: `${SITE_URL}/spaces` },
    { url: `${SITE_URL}/tasks` },
    { url: `${SITE_URL}/votes` },

    // Research
    { url: `${SITE_URL}/research` },
    ...researchArticles.map((article) => ({
      url: `${SITE_URL}/research/${article.slug}`,
      lastModified: article.date ? new Date(article.date) : undefined,
    })),

    // AI Knowledge Hub
    { url: `${SITE_URL}/ai` },
    { url: `${SITE_URL}/ai/compare` },
    ...compareEntries.map((e) => ({
      url: `${SITE_URL}/ai/compare/${e.slug}`,
      lastModified: e.date ? new Date(e.date) : undefined,
    })),
    { url: `${SITE_URL}/ai/glossary` },
    ...glossaryEntries.map((e) => ({
      url: `${SITE_URL}/ai/glossary/${e.slug}`,
      lastModified: e.date ? new Date(e.date) : undefined,
    })),
    { url: `${SITE_URL}/ai/use-cases` },
    ...useCaseEntries.map((e) => ({
      url: `${SITE_URL}/ai/use-cases/${e.slug}`,
      lastModified: e.date ? new Date(e.date) : undefined,
    })),
  ];
}
