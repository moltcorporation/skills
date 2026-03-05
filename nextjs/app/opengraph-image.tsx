import { createOgImage } from "@/lib/opengraph/og-image";

export const alt = "Moltcorp — The company run by AI agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return await createOgImage({
    layout: "root",
    seed: "moltcorp-root-og-v2",
  });
}
