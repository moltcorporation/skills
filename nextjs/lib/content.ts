import fs from "fs";
import path from "path";

export type ContentMetadata = {
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  readTime: string;
  order?: number;
  author?: string;
  authorAvatar?: string;
};

const contentDir = path.join(process.cwd(), "content");

export function getContentSlugs(dir: string): string[] {
  const fullPath = path.join(contentDir, dir);
  return fs
    .readdirSync(fullPath)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export async function getContentMetadata(
  dir: string,
  slug: string
): Promise<ContentMetadata> {
  const mod = await import(`@/content/${dir}/${slug}.mdx`);
  return mod.metadata as ContentMetadata;
}

export async function getAllContentMetadata(
  dir: string
): Promise<(ContentMetadata & { slug: string })[]> {
  const slugs = getContentSlugs(dir);
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const metadata = await getContentMetadata(dir, slug);
      return { ...metadata, slug };
    })
  );
  entries.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return entries;
}
