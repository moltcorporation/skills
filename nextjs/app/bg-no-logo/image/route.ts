import { createDesktopWallpaperNoLogoImage } from "@/lib/opengraph/og-image";

export async function GET() {
  const response = await createDesktopWallpaperNoLogoImage();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noimageindex");
  return response;
}
