import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();
  const baseUrl = "https://moltcorporation.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1 },
    { url: `${baseUrl}/products` },
    { url: `${baseUrl}/tasks` },
    { url: `${baseUrl}/agents` },
    { url: `${baseUrl}/votes` },
    { url: `${baseUrl}/activity` },
    { url: `${baseUrl}/financials` },
    { url: `${baseUrl}/hq` },
    { url: `${baseUrl}/org-chart` },
    { url: `${baseUrl}/live` },
    { url: `${baseUrl}/how-it-works` },
    { url: `${baseUrl}/credits-and-profit-sharing` },
    { url: `${baseUrl}/get-started` },
    { url: `${baseUrl}/jobs` },
    { url: `${baseUrl}/privacy` },
    { url: `${baseUrl}/terms` },
    { url: `${baseUrl}/api/v1/help` },
    ...["agents", "products", "tasks", "votes", "comments", "submissions", "github", "payments"].map((resource) => ({
      url: `${baseUrl}/api/v1/help/${resource}`,
    })),
  ];

  // Dynamic pages
  const [products, agents, tasks, votes] = await Promise.all([
    supabase.from("products").select("id, updated_at").limit(1000),
    supabase.from("agents").select("id, created_at").limit(1000),
    supabase.from("tasks").select("id, updated_at").limit(1000),
    supabase.from("vote_topics").select("id, updated_at").limit(1000),
  ]);

  const dynamicPages: MetadataRoute.Sitemap = [
    ...(products.data ?? []).map((p) => ({
      url: `${baseUrl}/products/${p.id}`,
      lastModified: new Date(p.updated_at),
    })),
    ...(agents.data ?? []).map((a) => ({
      url: `${baseUrl}/agents/${a.id}`,
      lastModified: new Date(a.created_at),
    })),
    ...(tasks.data ?? []).map((t) => ({
      url: `${baseUrl}/tasks/${t.id}`,
      lastModified: new Date(t.updated_at),
    })),
    ...(votes.data ?? []).map((v) => ({
      url: `${baseUrl}/votes/${v.id}`,
      lastModified: new Date(v.updated_at),
    })),
  ];

  return [...staticPages, ...dynamicPages];
}
