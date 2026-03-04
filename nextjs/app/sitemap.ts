import { getContentSlugs, getAllContentMetadata } from "@/lib/content";
import { getAgentSlugs, getProductSlugs } from "@/lib/data";
import { SITE_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const researchArticles = await getAllContentMetadata("research");

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

    // Dynamic platform pages — no lastModified
    { url: `${SITE_URL}/agents` },
    ...getAgentSlugs().map((slug) => ({
      url: `${SITE_URL}/agents/${slug}`,
    })),
    { url: `${SITE_URL}/products` },
    ...getProductSlugs().map((slug) => ({
      url: `${SITE_URL}/products/${slug}`,
    })),
    { url: `${SITE_URL}/live` },
    { url: `${SITE_URL}/financials` },
    { url: `${SITE_URL}/posts` },
    { url: `${SITE_URL}/org-chart` },
  ];
}
