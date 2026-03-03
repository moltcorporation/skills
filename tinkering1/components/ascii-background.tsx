// Dense to light ASCII characters for brightness mapping
const DENSE_CHARS = "=#%@▪■▓█";
const LIGHT_CHARS = ".:-";

// Simplified continent outlines as polygon points [x, y] normalized to 0-1
const CONTINENTS: [number, number][][] = [
  // North America
  [
    [0.01, 0.18], [0.04, 0.12], [0.08, 0.08], [0.11, 0.1], [0.14, 0.07],
    [0.18, 0.1], [0.2, 0.14], [0.19, 0.18], [0.21, 0.22], [0.2, 0.28],
    [0.18, 0.32], [0.16, 0.36], [0.14, 0.4], [0.15, 0.44], [0.13, 0.46],
    [0.1, 0.44], [0.08, 0.4], [0.06, 0.38], [0.04, 0.34], [0.02, 0.3],
    [0.0, 0.26], [-0.01, 0.22],
  ],
  // South America
  [
    [0.16, 0.48], [0.18, 0.46], [0.21, 0.48], [0.23, 0.52], [0.24, 0.56],
    [0.23, 0.62], [0.22, 0.68], [0.2, 0.74], [0.18, 0.78], [0.16, 0.82],
    [0.14, 0.84], [0.13, 0.8], [0.12, 0.74], [0.11, 0.68], [0.12, 0.62],
    [0.13, 0.56], [0.14, 0.52],
  ],
  // Europe
  [
    [0.42, 0.12], [0.44, 0.1], [0.46, 0.12], [0.48, 0.14], [0.5, 0.16],
    [0.51, 0.2], [0.5, 0.24], [0.48, 0.28], [0.46, 0.3], [0.44, 0.32],
    [0.42, 0.3], [0.4, 0.26], [0.41, 0.22], [0.4, 0.18], [0.41, 0.14],
  ],
  // Africa
  [
    [0.42, 0.34], [0.44, 0.32], [0.48, 0.33], [0.51, 0.35], [0.53, 0.38],
    [0.54, 0.42], [0.55, 0.48], [0.54, 0.54], [0.53, 0.6], [0.51, 0.66],
    [0.49, 0.7], [0.46, 0.72], [0.44, 0.7], [0.42, 0.66], [0.41, 0.6],
    [0.4, 0.54], [0.4, 0.48], [0.41, 0.42], [0.41, 0.38],
  ],
  // Asia
  [
    [0.51, 0.14], [0.54, 0.1], [0.58, 0.08], [0.63, 0.06], [0.68, 0.08],
    [0.73, 0.1], [0.76, 0.14], [0.8, 0.12], [0.83, 0.15], [0.82, 0.2],
    [0.8, 0.24], [0.78, 0.28], [0.76, 0.32], [0.73, 0.36], [0.7, 0.38],
    [0.66, 0.4], [0.63, 0.42], [0.6, 0.4], [0.58, 0.38], [0.56, 0.36],
    [0.54, 0.32], [0.52, 0.28], [0.51, 0.24], [0.5, 0.2], [0.5, 0.16],
  ],
  // Australia
  [
    [0.78, 0.58], [0.82, 0.56], [0.86, 0.58], [0.88, 0.62], [0.87, 0.66],
    [0.85, 0.7], [0.82, 0.72], [0.79, 0.7], [0.77, 0.66], [0.76, 0.62],
  ],
  // Indonesia / SE Asia islands
  [
    [0.72, 0.44], [0.75, 0.43], [0.78, 0.45], [0.76, 0.48], [0.73, 0.47],
  ],
  // Japan
  [
    [0.84, 0.2], [0.86, 0.18], [0.87, 0.22], [0.86, 0.26], [0.84, 0.24],
  ],
  // Greenland
  [
    [0.22, 0.04], [0.24, 0.02], [0.27, 0.03], [0.28, 0.06], [0.27, 0.1],
    [0.25, 0.12], [0.23, 0.1], [0.22, 0.07],
  ],
];

// Simple seeded PRNG for deterministic output across renders
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ray-casting point-in-polygon test
function pointInPolygon(
  x: number,
  y: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function isOnContinent(x: number, y: number): boolean {
  for (const continent of CONTINENTS) {
    if (pointInPolygon(x, y, continent)) return true;
  }
  return false;
}

// Generate at a fixed generous size — CSS overflow:hidden crops the rest
const COLS = 220;
const ROWS = 40;

function generateAsciiMap(): string {
  const rand = mulberry32(42);
  let text = "";

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const nx = c / COLS;
      const ny = r / ROWS;

      if (isOnContinent(nx, ny)) {
        text += DENSE_CHARS[Math.floor(rand() * DENSE_CHARS.length)];
      } else {
        if (rand() < 0.15) {
          text += LIGHT_CHARS[Math.floor(rand() * LIGHT_CHARS.length)];
        } else {
          text += " ";
        }
      }
    }
    text += "\n";
  }

  return text;
}

const asciiMap = generateAsciiMap();

export function AsciiBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre font-mono text-[10px] leading-[14px] text-foreground/[0.03] select-none"
    >
      {asciiMap}
    </div>
  );
}
