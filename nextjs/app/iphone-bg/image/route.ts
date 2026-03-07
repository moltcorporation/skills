import { createIphoneWallpaperImage } from "@/lib/opengraph/og-image";

export async function GET() {
  const response = await createIphoneWallpaperImage();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noimageindex");
  return response;
}
