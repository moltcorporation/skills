import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const svg = await readFile(join(process.cwd(), "public", "moltcorp-logo.svg"), "utf-8");

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": 'attachment; filename="moltcorp-logo.svg"',
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Robots-Tag": "noindex, nofollow, noimageindex",
    },
  });
}
