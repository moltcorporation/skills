import { SITE_URL } from "@/lib/constants";
import { getTaskSitemapEntries } from "@/lib/data/tasks";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: tasks } = await getTaskSitemapEntries();

  return tasks.map((task) => ({
    url: `${SITE_URL}/tasks/${task.id}`,
    lastModified: new Date(task.created_at),
  }));
}
