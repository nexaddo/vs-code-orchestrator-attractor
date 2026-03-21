/**
 * ProgressBar — horizontal progress indicator with full ARIA support.
 *
 * Used by: ActiveRunsPanel (milestone completion %), RunHeader (overall progress),
 *          and any loading-state that has a deterministic value.
 *
 * Modes:
 *   determinate   – requires `value` (0–100). Renders filled portion.
 *   indeterminate – `value` omitted. Renders animated sliding bar.
 *
 * Color follows the run status when provided (defaults to running/blue).
 */

import { type JSX } from "preact";
import { cn } from "../lib/utils";
import type { Status } from "./StatusBadge";

// ── Color map: status → CSS variable ─────────────────────────────────────────

const STATUS_COLOR: Record<Status, string> = {
  queued: "var(--color-status-queued)",
  running: "var(--color-status-running)",
  blocked: "var(--color-status-blocked)",
  failed: "var(--color-status-failed)",
  succeeded: "var(--color-status-succeeded)",
  canceled: "var(--color-status-canceled)"
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ProgressBarProps {
  /**
   * Completion percentage 0–100.
   * Omit for indeterminate (animated) mode.
   */
  value?: number | undefined;
  /** Overrides the bar fill colour. Defaults to `running` blue. */
  status?: Status | undefined;
  /** Accessible label for screen readers. */
  label?: string | undefined;
  /** Height in pixels. Defaults to 4. */
  height?: number | undefined;
  class?: string | undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  status = "running",
  label,
  height = 4,
  class: className
}: ProgressBarProps) {
  const isIndeterminate = value === undefined;
  const clampedValue = isIndeterminate ? 0 : Math.min(100, Math.max(0, value));
  const color = STATUS_COLOR[status];

  return (
    <div
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      aria-valuetext={isIndeterminate ? "Loading…" : `${clampedValue}%`}
      class={cn(
        "relative w-full overflow-hidden rounded-full",
        "bg-[color:var(--color-vscode-list-inactive)]",
        className
      )}
      style={{ height: `${height}px` } as JSX.CSSProperties}
    >
      {isIndeterminate ? (
        /* Indeterminate: sliding bar animation */
        <div
          class="absolute inset-y-0 w-1/3 rounded-full"
          style={
            {
              backgroundColor: color,
              animation: "var(--animate-progress-indeterminate)"
            } as JSX.CSSProperties
          }
          aria-hidden="true"
        />
      ) : (
        /* Determinate: filled portion */
        <div
          class="h-full rounded-full transition-[width] duration-300 ease-out"
          style={
            {
              width: `${clampedValue}%`,
              backgroundColor: color
            } as JSX.CSSProperties
          }
          aria-hidden="true"
        />
      )}
    </div>
  );
}
