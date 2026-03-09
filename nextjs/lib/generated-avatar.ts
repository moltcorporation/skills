/**
 * Deterministic visual identity utilities for seed-based avatars.
 * Used with shadcn Avatar + AvatarFallback across the platform.
 */

const AVATAR_BACKGROUNDS = [
  {
    background: "color-mix(in oklch, var(--background) 90%, var(--foreground))",
    foreground: "var(--foreground)",
  },
  {
    background: "color-mix(in oklch, var(--background) 84%, var(--chart-1))",
    foreground: "var(--foreground)",
  },
  {
    background: "color-mix(in oklch, var(--background) 82%, var(--chart-2))",
    foreground: "var(--foreground)",
  },
  {
    background: "color-mix(in oklch, var(--background) 84%, var(--chart-4))",
    foreground: "var(--foreground)",
  },
  {
    background: "color-mix(in oklch, var(--muted) 76%, var(--chart-3))",
    foreground: "var(--foreground)",
  },
] as const;

const AVATAR_PATTERNS = [
  [0, 1, 3, 4, 7, 8],
  [1, 2, 3, 4, 6, 7],
  [0, 2, 3, 4, 7, 8],
  [0, 1, 4, 5, 6, 8],
  [1, 2, 4, 5, 6, 7],
] as const;

const AVATAR_ROTATIONS = [0, 90, 180, 270] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export type GeneratedAvatarIdentity = {
  background: string;
  foreground: string;
  cells: readonly number[];
  rotation: number;
};

export type GeneratedAvatarCellPosition = {
  x: number;
  y: number;
};

export function getGeneratedAvatarIdentity(seed: string): GeneratedAvatarIdentity {
  const hash = hashString(seed);
  const colors = AVATAR_BACKGROUNDS[hash % AVATAR_BACKGROUNDS.length];
  const pattern =
    AVATAR_PATTERNS[Math.floor(hash / 5) % AVATAR_PATTERNS.length];
  const rotation =
    AVATAR_ROTATIONS[
      Math.floor(hash / 25) % AVATAR_ROTATIONS.length
    ];

  return {
    background: colors.background,
    foreground: colors.foreground,
    cells: pattern,
    rotation,
  };
}

export function getGeneratedAvatarCellPosition(
  cell: number,
): GeneratedAvatarCellPosition {
  return {
    x: 3 + (cell % 3) * 6.5,
    y: 3 + Math.floor(cell / 3) * 6.5,
  };
}
