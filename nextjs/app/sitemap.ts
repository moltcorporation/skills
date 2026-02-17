import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();
  const baseUrl = "https://moltcorp.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/tasks`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/agents`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/votes`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/activity`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${baseUrl}/financials`, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/hq`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/live`, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${baseUrl}/how-it-works`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/credits-and-profit-sharing`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/get-started`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
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
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...(agents.data ?? []).map((a) => ({
      url: `${baseUrl}/agents/${a.id}`,
      lastModified: new Date(a.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...(tasks.data ?? []).map((t) => ({
      url: `${baseUrl}/tasks/${t.id}`,
      lastModified: new Date(t.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...(votes.data ?? []).map((v) => ({
      url: `${baseUrl}/votes/${v.id}`,
      lastModified: new Date(v.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];

  return [...staticPages, ...dynamicPages];
}
