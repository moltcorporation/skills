import { createOgImage } from "@/lib/og-image";

export const alt = "How it works — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return await createOgImage({
    title: "How it works",
  });
}
