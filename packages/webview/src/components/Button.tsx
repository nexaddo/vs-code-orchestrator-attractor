/**
 * Button — primary action element for all surfaces.
 *
 * Variants match VS Code's button model:
 *   primary   → vscode-button-background (blue accent)
 *   secondary → vscode-button-secondaryBackground (muted)
 *   ghost     → transparent, hover reveal
 *   danger    → vscode-errorForeground tint (destructive actions)
 *   link      → inline text button
 *
 * Sizes: sm | md (default) | lg
 */

import { type ComponentChildren, type JSX } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// ── Variants ─────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base: focusable, accessible, no text wrap
  [
    "inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap",
    "rounded-[--radius-md] select-none cursor-pointer",
    "transition-colors duration-100",
    "focus-visible:outline focus-visible:outline-1 focus-visible:outline-[color:var(--color-vscode-focus-border)] focus-visible:outline-offset-1",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[color:var(--color-vscode-button-bg)] text-[color:var(--color-vscode-button-fg)]",
          "hover:bg-[color:var(--color-vscode-button-hover)]"
        ],
        secondary: [
          "bg-[color:var(--color-vscode-button-secondary-bg)] text-[color:var(--color-vscode-button-secondary-fg)]",
          "hover:bg-[color:var(--color-vscode-button-secondary-hover)]"
        ],
        ghost: [
          "bg-transparent text-[color:var(--color-foreground)]",
          "hover:bg-[color:var(--color-vscode-list-hover)]"
        ],
        danger: [
          "bg-[color:var(--color-status-failed-bg)] text-[color:var(--color-status-failed)]",
          "hover:bg-[color:var(--color-vscode-error-border)]"
        ],
        link: [
          "bg-transparent underline-offset-2 text-[color:var(--color-vscode-link)]",
          "hover:underline p-0 h-auto"
        ]
      },
      size: {
        sm: "h-6  px-2   text-[length:var(--text-xs)]",
        md: "h-7  px-3   text-[length:var(--text-sm)]",
        lg: "h-8  px-4   text-[length:var(--text-base)]"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends
    VariantProps<typeof buttonVariants>,
    Omit<JSX.HTMLAttributes<HTMLButtonElement>, "size"> {
  /** Codicon class name to render as leading icon (e.g. "codicon codicon-play"). */
  icon?: string | undefined;
  children?: ComponentChildren | undefined;
  class?: string | undefined;
  disabled?: boolean | undefined;
  type?: "button" | "submit" | "reset" | undefined;
  onClick?: JSX.MouseEventHandler<HTMLButtonElement> | undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Button({
  variant,
  size,
  icon,
  children,
  class: className,
  disabled,
  type = "button",
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      class={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && (
        <i
          class={cn(icon, "text-[1em] leading-none shrink-0")}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
