/**
 * EmptyState — full-surface placeholder for empty, error, and loading states.
 *
 * Used by every surface (Overview, Repository Detail, Plan Dashboard, Run Inspector)
 * and by most panel-level components when their data array is empty.
 *
 * Spec §9 defines the exact copy for each surface — this component provides the
 * structural shell; callers supply the icon, heading, subtext, and CTA.
 *
 * Variants:
 *   default  – centred vertically and horizontally (full-surface states)
 *   inline   – compact, left-aligned (inside panels/cards)
 *   loading  – spinning icon, no CTA
 */

import { type ComponentChildren, type JSX } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./Button";

// ── Variants ─────────────────────────────────────────────────────────────────

const emptyStateVariants = cva("flex flex-col items-center text-center gap-3", {
  variants: {
    variant: {
      default: "justify-center py-12 px-6",
      inline: "items-start text-left py-4 px-3 gap-2",
      loading: "justify-center py-12 px-6"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

// ── CTA descriptor ────────────────────────────────────────────────────────────

export interface EmptyStateCTA {
  label: string;
  icon?: string | undefined;
  onClick?: JSX.MouseEventHandler<HTMLButtonElement> | undefined;
  buttonProps?: Omit<ButtonProps, "children" | "onClick" | "icon"> | undefined;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface EmptyStateProps extends VariantProps<
  typeof emptyStateVariants
> {
  /**
   * Codicon class name (e.g. "codicon codicon-folder-opened").
   * In `loading` variant, the icon automatically spins.
   */
  icon: string;
  heading: string;
  subtext?: string | undefined;
  /** Primary call-to-action button. */
  cta?: EmptyStateCTA | undefined;
  /** Additional content rendered below subtext (e.g. secondary actions). */
  children?: ComponentChildren | undefined;
  class?: string | undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmptyState({
  variant = "default",
  icon,
  heading,
  subtext,
  cta,
  children,
  class: className
}: EmptyStateProps) {
  const isLoading = variant === "loading";
  const isInline = variant === "inline";

  return (
    <div class={cn(emptyStateVariants({ variant }), className)}>
      {/* Icon */}
      <i
        class={cn(
          icon,
          isInline ? "text-[1.2em]" : "text-[2.5em]",
          "leading-none",
          "text-[color:var(--color-vscode-description)]",
          isLoading && "animate-[var(--animate-spin)]"
        )}
        aria-hidden="true"
      />

      {/* Text content */}
      <div class={cn("flex flex-col gap-1", isInline ? "" : "items-center")}>
        <p
          class={cn(
            "font-semibold leading-snug",
            isInline
              ? "text-[length:var(--text-sm)]"
              : "text-[length:var(--text-base)]",
            "text-[color:var(--color-foreground)]"
          )}
        >
          {heading}
        </p>

        {subtext && (
          <p
            class={cn(
              "leading-snug",
              isInline
                ? "text-[length:var(--text-xs)]"
                : "text-[length:var(--text-sm)]",
              "text-[color:var(--color-vscode-description)]",
              !isInline && "max-w-xs"
            )}
          >
            {subtext}
          </p>
        )}
      </div>

      {/* CTA — only in non-loading states */}
      {!isLoading && cta && (
        <Button
          variant="primary"
          size="sm"
          icon={cta.icon}
          onClick={cta.onClick}
          {...cta.buttonProps}
        >
          {cta.label}
        </Button>
      )}

      {children}
    </div>
  );
}
