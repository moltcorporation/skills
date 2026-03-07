import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import {
  BRAND_WORDMARK_LETTER_SPACING,
  getBrandLockupMetrics,
} from "@/lib/brand-lockup";

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

const DEFAULT_COLS = 240;
const DEFAULT_ROWS = 50;

function generateAsciiArt(
  seed: string,
  { cols = DEFAULT_COLS, rows = DEFAULT_ROWS }: { cols?: number; rows?: number } = {},
): string {
  const rand = mulberry32(stringToSeed(seed));

  // Create a few random "blobs" of density across the canvas
  const blobs: { cx: number; cy: number; r: number; strength: number }[] = [];
  const blobCount = 6 + Math.floor(rand() * 8);
  for (let i = 0; i < blobCount; i++) {
    blobs.push({
      cx: rand() * cols,
      cy: rand() * rows,
      r: 8 + rand() * 30,
      strength: 0.2 + rand() * 0.6,
    });
  }

  let text = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
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

      if (rand() < Math.min(density * 1.2, 0.92)) {
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

const ICON_OFFSET_X = 96;
const ICON_OFFSET_Y = 97;

// --- Font loading (local static TTF files) ---

const fontsDir = join(process.cwd(), "lib", "opengraph", "fonts");

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

type OgImageLayout = "root" | "short-title" | "long-title";

function ColonyIcon({ size }: { size: number }) {
  const logoScale = size / 322;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: size,
        height: size,
      }}
    >
      {COLONY_RECTS.map((rect, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (rect.x - ICON_OFFSET_X) * logoScale,
            top: (rect.y - ICON_OFFSET_Y) * logoScale,
            width: rect.w * logoScale,
            height: rect.h * logoScale,
            borderRadius: 1,
            backgroundColor: "#fafafa",
          }}
        />
      ))}
    </div>
  );
}

function OgFrame({
  asciiArt,
  children,
  inset = 40,
  dotInset = 37,
}: {
  asciiArt: string;
  children: ReactElement;
  inset?: number;
  dotInset?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#0a0a0a",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          color: "rgba(250, 250, 250, 0.075)",
          fontSize: "11px",
          lineHeight: "16px",
          fontFamily: "Geist Mono",
          fontWeight: 600,
          whiteSpace: "pre",
          overflow: "hidden",
        }}
      >
        {asciiArt}
      </div>

      <div
        style={{
          position: "absolute",
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          border: "1px solid rgba(250, 250, 250, 0.12)",
          display: "flex",
        }}
      />

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
            ...Object.fromEntries(
              Object.entries(pos).map(([key, value]) => [key, value === 37 ? dotInset : value]),
            ),
          }}
        />
      ))}

      {children}
    </div>
  );
}

export async function createOgImage({
  title,
  layout = "short-title",
  seed,
}: {
  title?: string;
  layout?: OgImageLayout;
  seed?: string;
}): Promise<ImageResponse> {
  if (layout !== "root" && !title) {
    throw new Error("createOgImage: title is required for non-root layouts");
  }

  const [asciiArt, fonts] = await Promise.all([
    Promise.resolve(generateAsciiArt(seed ?? title ?? "moltcorp-root-og")),
    loadFonts(),
  ]);

  // All brand lockups use shared ratios so icon/text spacing stays consistent at any scale.
  const rootIconSize = 120;
  const rootLockup = getBrandLockupMetrics(rootIconSize);
  const longIconSize = 44;
  const longLockup = getBrandLockupMetrics(longIconSize);
  const shortIconSize = 64;
  const shortLockup = getBrandLockupMetrics(shortIconSize);

  const content =
    layout === "root" ? (
      <div
        style={{
          display: "flex",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          <ColonyIcon size={rootIconSize} />
          <div
            style={{
              display: "flex",
              marginLeft: rootLockup.wordmarkGap,
              fontSize: rootLockup.wordmarkSize,
              fontFamily: "Geist Mono",
              fontWeight: 600,
              color: "rgba(250, 250, 250, 0.95)",
              letterSpacing: BRAND_WORDMARK_LETTER_SPACING,
              lineHeight: 1,
            }}
          >
            moltcorp
          </div>
        </div>
      </div>
    ) : layout === "long-title" ? (
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "64px 0 0 72px",
          }}
        >
          <ColonyIcon size={longIconSize} />
          <div
            style={{
              display: "flex",
              marginLeft: longLockup.wordmarkGap,
              fontSize: longLockup.wordmarkSize,
              fontFamily: "Geist Mono",
              fontWeight: 600,
              color: "#fafafa",
              letterSpacing: BRAND_WORDMARK_LETTER_SPACING,
              lineHeight: 1,
            }}
          >
            moltcorp
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            padding: "0 96px 32px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontFamily: "Inter",
              fontWeight: 500,
              color: "#fafafa",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              maxWidth: 760,
            }}
          >
            {title}
          </div>
        </div>
      </div>
    ) : (
      <div
        style={{
          display: "flex",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <ColonyIcon size={shortIconSize} />
        <div
          style={{
            display: "flex",
            marginLeft: shortLockup.wordmarkGap,
            fontSize: shortLockup.wordmarkSize,
            fontFamily: "Geist Mono",
            fontWeight: 600,
            color: "#fafafa",
            letterSpacing: BRAND_WORDMARK_LETTER_SPACING,
            lineHeight: 1,
          }}
        >
          moltcorp
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: shortLockup.dividerGap,
            width: 1,
            height: 76,
            backgroundColor: "rgba(250, 250, 250, 0.2)",
          }}
        />
        <div
          style={{
            display: "flex",
            marginLeft: shortLockup.dividerGap,
            fontSize: 56,
            fontFamily: "Inter",
            fontWeight: 500,
            color: "#fafafa",
            lineHeight: 1.1,
            maxWidth: 420,
          }}
        >
          {title}
        </div>
      </div>
    );

  return new ImageResponse(<OgFrame asciiArt={asciiArt}>{content}</OgFrame>, {
    width: 1200,
    height: 630,
    fonts,
  });
}

export async function createRootOgImage(): Promise<ImageResponse> {
  return createOgImage({ layout: "root", seed: "moltcorp-root-og" });
}

export async function createIphoneWallpaperImage(): Promise<ImageResponse> {
  const width = 1290;
  const height = 2796;

  const [asciiArt, fonts] = await Promise.all([
    Promise.resolve(
      generateAsciiArt("moltcorp-iphone-wallpaper", {
        cols: 120,
        rows: 172,
      }),
    ),
    loadFonts(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0a0a0a",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            left: -120,
            right: -200,
            bottom: -140,
            display: "flex",
            color: "rgba(250, 250, 250, 0.12)",
            fontSize: "18px",
            lineHeight: "22px",
            fontFamily: "Geist Mono",
            fontWeight: 600,
            whiteSpace: "pre",
            overflow: "hidden",
            transform: "scale(1.08)",
          }}
        >
          {asciiArt}
        </div>

        <div
          style={{
            position: "absolute",
            top: 56,
            left: 56,
            right: 56,
            bottom: 56,
            border: "1px solid rgba(250, 250, 250, 0.14)",
            display: "flex",
          }}
        />

        {[
          { top: 53, left: 53 },
          { top: 53, right: 53 },
          { bottom: 53, left: 53 },
          { bottom: 53, right: 53 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "rgba(250, 250, 250, 0.22)",
              ...pos,
            }}
          />
        ))}

        <div
          style={{
            display: "flex",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          <ColonyIcon size={360} />
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts,
    },
  );
}
