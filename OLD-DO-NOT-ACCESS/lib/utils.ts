import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STATUS_BADGE_ACTIVE =
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
