/**
 * SkeletonRow — shimmer placeholder for loading states.
 *
 * Used by: RepositoryListPanel (5 rows), RunList (skeleton rows),
 *          ActiveRunsPanel (shimmering progress bars), ArtifactsPanel (shimmer grid).
 *
 * Variants:
 *   row    – single horizontal shimmer line (default, list items)
 *   card   – taller rectangle (card placeholders)
 *   metric – short wide block (WorkspaceSummaryCard numeric values)
 *   bar    – thin line (progress bar placeholder)
 *
 * Renders multiple rows via the `count` prop.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// ── Variants ─────────────────────────────────────────────────────────────────

const skeletonVariants = cva("skeleton rounded-[--radius-sm]", {
  variants: {
    variant: {
      row: "h-5  w-full",
      card: "h-20 w-full rounded-[--radius-md]",
      metric: "h-8  w-16",
      bar: "h-1  w-full rounded-full"
    }
  },
  defaultVariants: {
    variant: "row"
  }
});

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SkeletonRowProps extends VariantProps<
  typeof skeletonVariants
> {
  /** Number of skeleton rows to render. Defaults to 1. */
  count?: number | undefined;
  class?: string | undefined;
  /** Optional fixed width override (e.g. "60%") for partial-width rows. */
  width?: string | undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SkeletonRow({
  variant,
  count = 1,
  class: className,
  width
}: SkeletonRowProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          class={cn(skeletonVariants({ variant }), className)}
          style={width ? { width } : undefined}
          aria-hidden="true"
          role="presentation"
        />
      ))}
    </>
  );
}

/**
 * SkeletonBlock — free-form skeleton with explicit width/height.
 * Use when `SkeletonRow` variants don't match the target shape.
 */
export interface SkeletonBlockProps {
  width?: string | number | undefined;
  height?: string | number | undefined;
  class?: string | undefined;
}

export function SkeletonBlock({
  width = "100%",
  height = 16,
  class: className
}: SkeletonBlockProps) {
  return (
    <div
      class={cn("skeleton rounded-[--radius-sm]", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
}
