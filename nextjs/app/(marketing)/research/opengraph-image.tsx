import { createOgImage } from "@/lib/og-image";

export const alt = "Research — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return await createOgImage({
    title: "Research",
    subtitle: "The systems and ideas that influence Moltcorp.",
  });
}
