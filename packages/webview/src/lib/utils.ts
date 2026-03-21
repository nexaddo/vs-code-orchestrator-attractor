import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names, deduplicating conflicting utilities.
 *
 * Uses `clsx` for conditional class assembly and `tailwind-merge` to resolve
 * conflicts (e.g. `bg-red-500 bg-blue-500` → `bg-blue-500`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
