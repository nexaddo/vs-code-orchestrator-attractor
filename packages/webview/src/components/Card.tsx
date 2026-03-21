/**
 * Card — surface container with optional header, content, and footer slots.
 *
 * Used by: WorkspaceSummaryCard, ActiveRunsPanel cards, RecentFailuresPanel entries,
 *          NodeInspector panel, and any panel that needs a bordered surface.
 *
 * Sub-components exported:
 *   Card        – root container
 *   CardHeader  – top section (typically title + toolbar)
 *   CardTitle   – heading text inside CardHeader
 *   CardContent – scrollable body
 *   CardFooter  – bottom action row
 *
 * The `intent` prop supports a red-left-border style for failure entries
 * (spec: RecentFailuresPanel uses --vscode-inputValidation-errorBorder).
 */

import { type ComponentChildren, type JSX } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// ── Card root ─────────────────────────────────────────────────────────────────

const cardVariants = cva(
  [
    "rounded-[--radius-md] border",
    "bg-[color:var(--color-vscode-panel-bg,var(--color-background))]",
    "border-[color:var(--color-vscode-panel-border,var(--color-border))]",
    "text-[color:var(--color-foreground)]"
  ],
  {
    variants: {
      intent: {
        default: "",
        failure: "border-l-2 border-l-[color:var(--color-vscode-error-border)]"
      }
    },
    defaultVariants: {
      intent: "default"
    }
  }
);

export interface CardProps
  extends
    VariantProps<typeof cardVariants>,
    JSX.HTMLAttributes<HTMLDivElement> {
  class?: string | undefined;
  children?: ComponentChildren | undefined;
}

export function Card({
  intent,
  class: className,
  children,
  ...props
}: CardProps) {
  return (
    <div class={cn(cardVariants({ intent }), className)} {...props}>
      {children}
    </div>
  );
}

// ── CardHeader ────────────────────────────────────────────────────────────────

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string | undefined;
  children?: ComponentChildren | undefined;
}

export function CardHeader({
  class: className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      class={cn(
        "flex items-center justify-between gap-2 px-3 py-2",
        "border-b border-[color:var(--color-vscode-panel-border,var(--color-border))]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── CardTitle ─────────────────────────────────────────────────────────────────

export interface CardTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  class?: string | undefined;
  children?: ComponentChildren | undefined;
  /** Rendered heading level. Defaults to h3 for accessibility. */
  level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
}

export function CardTitle({
  class: className,
  children,
  level = 3,
  ...props
}: CardTitleProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Tag
      class={cn(
        "text-[length:var(--text-sm)] font-semibold leading-none",
        "text-[color:var(--color-vscode-settings-header)]",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ── CardContent ───────────────────────────────────────────────────────────────

export interface CardContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string | undefined;
  children?: ComponentChildren | undefined;
}

export function CardContent({
  class: className,
  children,
  ...props
}: CardContentProps) {
  return (
    <div class={cn("p-3", className)} {...props}>
      {children}
    </div>
  );
}

// ── CardFooter ────────────────────────────────────────────────────────────────

export interface CardFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string | undefined;
  children?: ComponentChildren | undefined;
}

export function CardFooter({
  class: className,
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      class={cn(
        "flex items-center gap-2 px-3 py-2",
        "border-t border-[color:var(--color-vscode-panel-border,var(--color-border))]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
