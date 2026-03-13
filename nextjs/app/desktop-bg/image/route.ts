import { createDesktopWallpaperImage } from "@/lib/opengraph/og-image";

export async function GET() {
  const response = await createDesktopWallpaperImage();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noimageindex");
  return response;
}
