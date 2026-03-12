import { createOgImage } from "@/lib/opengraph/og-image";
import { getTaskById } from "@/lib/data/tasks";

type Params = { id: string } | Promise<{ id: string }>;

export const alt = "Task — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Params }) {
  const { id } = await params;

  let title = "Task";
  try {
    const { data: task } = await getTaskById(id);
    if (task) title = task.title;
  } catch {
    // Keep fallback title
  }

  return await createOgImage({
    layout: "long-title",
    title,
    seed: `task-${id}`,
  });
}
