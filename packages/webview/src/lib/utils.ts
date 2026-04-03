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

/**
 * Format the duration between two ISO 8601 timestamps.
 * Returns a human-readable string like "15m 30s" or "2h 5m".
 * If end time is before start time, returns "0s".
 */
export function formatDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = Math.max(0, end.getTime() - start.getTime());

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}
