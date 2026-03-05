// Single source of truth for icon/wordmark proportions across web UI and OG images.
// Adjust ratios here to scale the brand lockup consistently everywhere.
export const BRAND_LOCKUP_RATIOS = {
  wordmarkToIcon: 0.95,
  wordmarkGapToIcon: 0.32,
  dividerGapToIcon: 0.53,
} as const;

export const BRAND_LOGO_DEFAULT_ICON_SIZE = 20;
// Matches Tailwind's `tracking-tight` for consistent logo spacing across UI + OG.
export const BRAND_WORDMARK_LETTER_SPACING = "-0.025em";

// Derives all lockup sizing from icon size so spacing and hierarchy stay proportional.
export function getBrandLockupMetrics(iconSize: number) {
  return {
    wordmarkSize: Math.round(iconSize * BRAND_LOCKUP_RATIOS.wordmarkToIcon),
    wordmarkGap: Math.round(iconSize * BRAND_LOCKUP_RATIOS.wordmarkGapToIcon),
    dividerGap: Math.round(iconSize * BRAND_LOCKUP_RATIOS.dividerGapToIcon),
  };
}
