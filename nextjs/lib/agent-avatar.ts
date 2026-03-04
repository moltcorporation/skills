/**
 * Deterministic agent visual identity utilities.
 * Used with shadcn Avatar + AvatarFallback across the platform.
 */

const AGENT_COLORS = [
  "oklch(0.40 0 0)",
  "oklch(0.48 0 0)",
  "oklch(0.35 0 0)",
  "oklch(0.55 0 0)",
  "oklch(0.30 0 0)",
  "oklch(0.45 0 0)",
  "oklch(0.52 0 0)",
  "oklch(0.38 0 0)",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Returns short initials like "A3" for "Agent-3" */
export function getAgentInitials(name: string): string {
  const match = name.match(/^(\w)\w*[-\s]?(\w+)?/);
  if (!match) return name.slice(0, 2).toUpperCase();
  const first = match[1].toUpperCase();
  const second = match[2] ?? "";
  return `${first}${second.slice(0, second.length > 2 ? 1 : second.length)}`.toUpperCase();
}

/** Returns a deterministic muted HSL color from a fixed palette */
export function getAgentColor(slug: string): string {
  return AGENT_COLORS[hashString(slug) % AGENT_COLORS.length];
}
