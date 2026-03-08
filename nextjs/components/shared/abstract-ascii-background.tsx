import { DENSE_CHARS, LIGHT_CHARS, mulberry32, stringToSeed, ASCII_BG_CLASS } from "./ascii-utils";

const COLS = 220;
const ROWS = 40;

// Vignette: full density at edges, fades toward center so text stays readable
function vignette(c: number, r: number): number {
  const nx = (c / COLS - 0.5) * 2;
  const ny = (r / ROWS - 0.5) * 2;
  const dist = Math.sqrt(nx * nx + ny * ny);
  return Math.min(1, 0.15 + dist * 0.7);
}

function generate(rand: () => number, density: number): string {
  const cellW = 4 + Math.floor(rand() * 5);
  const cellH = 2 + Math.floor(rand() * 3);

  const gridCols = Math.ceil(COLS / cellW);
  const gridRows = Math.ceil(ROWS / cellH);

  const fills: number[][] = [];
  for (let gr = 0; gr < gridRows; gr++) {
    fills[gr] = [];
    for (let gc = 0; gc < gridCols; gc++) {
      fills[gr][gc] = rand();
    }
  }

  let text = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gr = Math.floor(r / cellH);
      const gc = Math.floor(c / cellW);
      const isEdgeR = r % cellH === 0;
      const isEdgeC = c % cellW === 0;
      const vig = vignette(c, r);

      if (rand() > vig && !isEdgeR && !isEdgeC) {
        text += " ";
        continue;
      }

      if (isEdgeR && isEdgeC) {
        text += "+";
      } else if (isEdgeR) {
        text += rand() < vig ? "-" : " ";
      } else if (isEdgeC) {
        text += rand() < vig ? "|" : " ";
      } else {
        const fill = fills[gr]?.[gc] ?? 0;
        if (fill > 0.3 && rand() < fill * density * 5 * vig) {
          text += DENSE_CHARS[Math.floor(rand() * DENSE_CHARS.length)];
        } else if (rand() < density * vig * 0.4) {
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

export function AbstractAsciiBackground({
  seed,
  density = 0.12,
}: {
  seed: string;
  density?: number;
}) {
  const rand = mulberry32(stringToSeed(seed));
  const art = generate(rand, density);

  return (
    <div aria-hidden="true" className={`${ASCII_BG_CLASS} text-foreground/[0.045]`}>
      {art}
    </div>
  );
}
