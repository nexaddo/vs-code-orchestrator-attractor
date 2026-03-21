/**
 * Badge — compact inline label for counts, labels, and repository roles.
 *
 * Distinct from StatusBadge: Badge is a generic pill for arbitrary text/numbers,
 * not bound to the execution status vocabulary.
 *
 * Used by:
 *   - WorkspaceSummaryCard metric counts
 *   - MilestonePanel "6/8 Nodes" progress summary
 *   - PlanMetadataPanel `$(lock)` read-only repo indicator
 *   - RepositoryListPanel branch label
 *   - vscode-badge-background styled count indicators
 *
 * Variants:
 *   default  – vscode badge colours (bg-[badge-bg] text-[badge-fg])
 *   count    – numeric chip, accent coloured
 *   outline  – border only, no fill
 *   lock     – $(lock) prefix, read-only semantics
 */

import { type ComponentChildren } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// ── Variants ─────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full text-[length:var(--text-xs)] font-medium leading-none whitespace-nowrap select-none px-1.5 py-0.5",
  {
    variants: {
      variant: {
        default: [
          "bg-[color:var(--color-vscode-badge-bg)]",
          "text-[color:var(--color-vscode-badge-fg)]"
        ],
        count: [
          "bg-[color:var(--color-vscode-badge-bg)]",
          "text-[color:var(--color-vscode-badge-fg)]",
          "tabular-nums min-w-[1.25rem] justify-center"
        ],
        outline: [
          "border border-[color:var(--color-vscode-panel-border)]",
          "text-[color:var(--color-vscode-description)]",
          "bg-transparent"
        ],
        lock: [
          "border border-[color:var(--color-vscode-panel-border)]",
          "text-[color:var(--color-vscode-description)]",
          "bg-transparent"
        ]
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children?: ComponentChildren | undefined;
  class?: string | undefined;
  /** Accessible label when content is purely numeric/iconic. */
  ariaLabel?: string | undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Badge({
  variant = "default",
  children,
  class: className,
  ariaLabel
}: BadgeProps) {
  const showLock = variant === "lock";

  return (
    <span
      class={cn(badgeVariants({ variant }), className)}
      aria-label={ariaLabel}
    >
      {showLock && (
        <i
          class="codicon codicon-lock text-[0.9em] leading-none shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/**
 * ProgressBadge — shows "current/total" fraction (e.g. "6/8 Nodes").
 * Used in MilestonePanel headers.
 */
export interface ProgressBadgeProps {
  current: number;
  total: number;
  unit?: string | undefined;
  class?: string | undefined;
}

export function ProgressBadge({
  current,
  total,
  unit,
  class: className
}: ProgressBadgeProps) {
  const label = unit ? `${current}/${total} ${unit}` : `${current}/${total}`;
  return (
    <Badge variant="count" class={className} ariaLabel={label}>
      {label}
    </Badge>
  );
}
