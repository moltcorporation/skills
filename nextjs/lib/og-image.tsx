import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// --- Inlined ASCII utils (Satori can't import from components) ---

const DENSE_CHARS = "=#%@&$X";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    const t0 = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    const t = (t0 + Math.imul(t0 ^ (t0 >>> 7), 61 | t0)) ^ t0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// --- ASCII art generation ---
// Dense characters only, filling the entire 1200x630 canvas.

const COLS = 240;
const ROWS = 50;

function generateAsciiArt(seed: string): string {
  const rand = mulberry32(stringToSeed(seed));

  // Create a few random "blobs" of density across the canvas
  const blobs: { cx: number; cy: number; r: number; strength: number }[] = [];
  const blobCount = 6 + Math.floor(rand() * 8);
  for (let i = 0; i < blobCount; i++) {
    blobs.push({
      cx: rand() * COLS,
      cy: rand() * ROWS,
      r: 8 + rand() * 30,
      strength: 0.2 + rand() * 0.6,
    });
  }

  let text = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Sum blob influence at this position
      let density = 0.08;
      for (const b of blobs) {
        const dx = (c - b.cx) / b.r;
        const dy = (r - b.cy) / b.r;
        const dist = dx * dx + dy * dy;
        if (dist < 1) {
          density += b.strength * (1 - dist);
        }
      }

      if (rand() < density) {
        text += DENSE_CHARS[Math.floor(rand() * DENSE_CHARS.length)];
      } else {
        text += " ";
      }
    }
    text += "\n";
  }
  return text;
}

// --- Colony icon rects (from colony-icon.tsx) ---

const COLONY_RECTS = [
  { x: 228, y: 97, w: 58, h: 58 },
  { x: 294, y: 97, w: 58, h: 58 },
  { x: 162, y: 163, w: 58, h: 58 },
  { x: 294, y: 163, w: 58, h: 58 },
  { x: 360, y: 163, w: 58, h: 58 },
  { x: 96, y: 229, w: 58, h: 58 },
  { x: 162, y: 229, w: 58, h: 58 },
  { x: 228, y: 229, w: 58, h: 58 },
  { x: 360, y: 229, w: 58, h: 58 },
  { x: 96, y: 295, w: 58, h: 58 },
  { x: 228, y: 295, w: 58, h: 58 },
  { x: 294, y: 295, w: 58, h: 58 },
  { x: 162, y: 361, w: 58, h: 58 },
  { x: 228, y: 361, w: 58, h: 58 },
];

const ICON_SCALE = 56 / 322; // render icon at ~56px to sit beside logo text
const ICON_OFFSET_X = 96;
const ICON_OFFSET_Y = 97;

// --- Font loading (local static TTF files) ---

const fontsDir = join(process.cwd(), "lib", "fonts");

async function loadFonts() {
  const [interMedium, geistMono] = await Promise.all([
    readFile(join(fontsDir, "Inter-Medium.ttf")),
    readFile(join(fontsDir, "GeistMono-SemiBold-Subset.ttf")),
  ]);

  return [
    { name: "Inter", data: interMedium, style: "normal" as const, weight: 500 as const },
    { name: "Geist Mono", data: geistMono, style: "normal" as const, weight: 600 as const },
  ];
}

// --- Main export ---

export async function createOgImage({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}): Promise<ImageResponse> {
  const [asciiArt, fonts] = await Promise.all([
    Promise.resolve(generateAsciiArt(title)),
    loadFonts(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* ASCII art background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            color: "rgba(250, 250, 250, 0.045)",
            fontSize: "11px",
            lineHeight: "16px",
            whiteSpace: "pre",
            overflow: "hidden",
          }}
        >
          {asciiArt}
        </div>

        {/* Blueprint border box */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: "1px solid rgba(250, 250, 250, 0.12)",
            display: "flex",
          }}
        />

        {/* Corner dots */}
        {[
          { top: 37, left: 37 },
          { top: 37, right: 37 },
          { bottom: 37, left: 37 },
          { bottom: 37, right: 37 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "rgba(250, 250, 250, 0.18)",
              ...pos,
            }}
          />
        ))}

        {/* Logo — top left */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "relative",
            padding: "64px 0 0 72px",
          }}
        >
          {/* Colony icon */}
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 32,
              height: 32,
            }}
          >
            {COLONY_RECTS.map((rect, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (rect.x - ICON_OFFSET_X) * (32 / 322),
                  top: (rect.y - ICON_OFFSET_Y) * (32 / 322),
                  width: rect.w * (32 / 322),
                  height: rect.h * (32 / 322),
                  borderRadius: 1,
                  backgroundColor: "#fafafa",
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: "Geist Mono",
              fontWeight: 600,
              color: "#fafafa",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            moltcorp
          </div>
        </div>

        {/* Title + subtitle — vertically centered in remaining space */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            padding: "0 72px",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontFamily: "Inter",
              fontWeight: 500,
              color: "#fafafa",
              lineHeight: 1.15,
              maxWidth: 800,
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 24,
                color: "rgba(250, 250, 250, 0.5)",
                marginTop: 20,
                lineHeight: 1.4,
                maxWidth: 700,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: "absolute",
            bottom: 54,
            left: 72,
            display: "flex",
            fontSize: 14,
            fontFamily: "Geist Mono",
            fontWeight: 600,
            color: "rgba(250, 250, 250, 0.4)",
            letterSpacing: "0.04em",
          }}
        >
          moltcorporation.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );
}
