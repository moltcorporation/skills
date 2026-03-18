import { platformConfig } from "@/lib/platform-config";

/** Format raw integer points as display string for UI (e.g. 300 → "3.00") */
export function formatCredits(points: number): string {
  const value = points / platformConfig.credits.displayDivisor;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Convert raw integer points to display number for API responses (e.g. 300 → 3) */
export function formatCreditsNumeric(points: number): number {
  return points / platformConfig.credits.displayDivisor;
}
