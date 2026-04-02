/**
 * LogLine — a single line in the terminal-like LogsPanel.
 *
 * Spec: LogsPanel uses `--vscode-terminal-background` and supports syntax
 * highlighting for model logs and shell output.
 *
 * LogLine handles:
 *   - Level colouring (info / warn / error / debug / plain)
 *   - Timestamp prefix (optional, ISO string → short HH:MM:SS.mmm)
 *   - Line number gutter (optional)
 *   - Text wrapping control
 *
 * Used by: LogsPanel, ValidationProblemsPanel (error lines).
 */

import { type JSX } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, formatTimestamp } from "../lib/utils";

// ── Level colours ─────────────────────────────────────────────────────────────

const lineVariants = cva(
  "flex gap-2 px-2 py-0.5 font-mono leading-relaxed hover:bg-[color:var(--color-vscode-list-hover)] select-text",
  {
    variants: {
      level: {
        plain:
          "text-[color:var(--color-vscode-terminal-fg,var(--color-foreground))]",
        info: "text-[color:var(--color-vscode-info)]",
        warn: "text-[color:var(--color-vscode-warning)]",
        error: "text-[color:var(--color-vscode-error)]",
        debug: "text-[color:var(--color-vscode-description)]"
      },
      wrap: {
        true: "whitespace-pre-wrap break-words",
        false: "whitespace-pre overflow-x-auto"
      }
    },
    defaultVariants: {
      level: "plain",
      wrap: false
    }
  }
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface LogLineProps extends VariantProps<typeof lineVariants> {
  text: string;
  /** ISO timestamp string. When provided, renders as a dimmed gutter prefix. */
  timestamp?: string | undefined;
  /** 1-based line number for the gutter. */
  lineNumber?: number | undefined;
  class?: string | undefined;
  /** onClick for lines that link to a node (ValidationProblemsPanel). */
  onClick?: JSX.MouseEventHandler<HTMLDivElement> | undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Component ─────────────────────────────────────────────────────────────────

export function LogLine({
  text,
  timestamp,
  lineNumber,
  level,
  wrap,
  class: className,
  onClick
}: LogLineProps) {
  const isClickable = onClick !== undefined;

  /** Activate on Enter / Space when row has role="button". */
  const handleKeyDown: JSX.KeyboardEventHandler<HTMLDivElement> | undefined =
    isClickable
      ? (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            (e.currentTarget as HTMLDivElement).click();
          }
        }
      : undefined;

  return (
    <div
      class={cn(
        lineVariants({ level, wrap }),
        isClickable && "cursor-pointer",
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Line number gutter */}
      {lineNumber !== undefined && (
        <span
          class="shrink-0 w-8 text-right select-none text-[color:var(--color-vscode-description)] text-[length:var(--text-xs)] leading-relaxed"
          aria-hidden="true"
        >
          {lineNumber}
        </span>
      )}

      {/* Timestamp gutter */}
      {timestamp && (
        <span
          class="shrink-0 text-[color:var(--color-vscode-description)] text-[length:var(--text-xs)] leading-relaxed tabular-nums"
          aria-hidden="true"
        >
          {formatTimestamp(timestamp)}
        </span>
      )}

      {/* Log text */}
      <span class="flex-1 text-[length:var(--text-sm)]">{text}</span>
    </div>
  );
}
