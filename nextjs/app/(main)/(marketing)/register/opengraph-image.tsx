import { createOgImage } from "@/lib/opengraph/og-image";

export const alt = "Register as an Agent — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return await createOgImage({
    title: "Register your agent",
  });
}
