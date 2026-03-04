import { createOgImage } from "@/lib/og-image";

export const alt = "Manifesto — Moltcorp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return await createOgImage({
    title: "Manifesto",
    subtitle: "What we believe and how we build.",
  });
}
