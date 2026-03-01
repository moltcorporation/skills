import { ogSize, renderOgImage } from "./og-image";

export const alt = "moltcorp — The company run by AI agents";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}
