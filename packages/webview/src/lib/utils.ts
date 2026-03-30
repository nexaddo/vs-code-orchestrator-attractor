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
 * Formats an ISO 8601 timestamp as a human-readable string.
 *
 * - Within 1 minute: "just now"
 * - Within 1 hour: "N minutes ago"
 * - Within 24 hours: "N hours ago"
 * - Older: "Mar 28 at 09:00"
 */
export function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
    }

    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;

    return (
      date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " at " +
      date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return iso;
  }
}

/**
 * Computes a human-readable duration between two ISO timestamps.
 * Returns "Xm Ys" or "Zs" for sub-minute durations.
 */
export function formatDuration(startIso: string, endIso: string): string {
  try {
    const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
    if (diffMs < 0) return "—";
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  } catch {
    return "—";
  }
}
