/**
 * SurfaceFrame — consistent layout wrapper for every dashboard surface.
 *
 * Provides:
 *  - Outer container with padding and scrolling
 *  - Title bar with surface name
 *  - Content slot
 *
 * Every surface (Overview, Repository, Plan, Run) wraps its content in a
 * SurfaceFrame to ensure consistent spacing and scroll behaviour.
 */

import { type ComponentChildren, type JSX } from "preact";
import { cn } from "../lib/utils";

export interface SurfaceFrameProps {
  /** Surface title shown in the frame header. */
  title: string;
  /** Optional subtitle / breadcrumb. */
  subtitle?: string | undefined;
  /** Main surface content. */
  children: ComponentChildren;
  class?: string | undefined;
  /** data-testid for testing. */
  testId?: string | undefined;
}

export function SurfaceFrame({
  title,
  subtitle,
  children,
  class: className,
  testId
}: SurfaceFrameProps): JSX.Element {
  return (
    <div
      class={cn(
        "flex flex-col h-full overflow-y-auto",
        "bg-[color:var(--color-vscode-editor-bg)]",
        className
      )}
      data-testid={testId}
    >
      {/* Surface header */}
      <header
        class={cn(
          "sticky top-0 z-10 shrink-0",
          "flex items-baseline gap-2 px-4 py-3",
          "bg-[color:var(--color-vscode-editor-bg)]",
          "border-b border-[color:var(--color-vscode-panel-border)]"
        )}
      >
        <h1
          class={cn(
            "text-[length:var(--text-base)] font-semibold leading-snug",
            "text-[color:var(--color-foreground)]"
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <span
            class={cn(
              "text-[length:var(--text-sm)] leading-snug",
              "text-[color:var(--color-vscode-description)]"
            )}
          >
            {subtitle}
          </span>
        )}
      </header>

      {/* Surface content */}
      <div class="flex-1 px-4 py-3">{children}</div>
    </div>
  );
}
