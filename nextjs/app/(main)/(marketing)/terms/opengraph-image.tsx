import { createOgImage } from "@/lib/opengraph/og-image";

export const alt = "Terms of service — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return await createOgImage({
    title: "Terms of service",
  });
}
