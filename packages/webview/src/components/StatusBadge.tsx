/**
 * StatusBadge — displays one of the 6 canonical execution statuses.
 *
 * Status vocabulary (spec §7):
 *   queued    → descriptionForeground  · $(clock)
 *   running   → progressBar-background · $(sync~spin)
 *   blocked   → editorWarning          · $(lock)
 *   failed    → errorForeground        · $(error)
 *   succeeded → testing-iconPassed     · $(check)
 *   canceled  → disabledForeground     · $(circle-slash)
 *
 * Variants:
 *   dot   – coloured dot only (RepositoryListPanel health indicators)
 *   text  – icon + label text (RunHeader, PlanList)
 *   count – icon + numeric suffix (WorkspaceSummaryCard)
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

export type Status =
  | "queued"
  | "running"
  | "blocked"
  | "failed"
  | "succeeded"
  | "canceled";

// Codicon class names for each status (rendered via the VS Code icon font)
const CODICON: Record<Status, string> = {
  queued: "codicon codicon-clock",
  running: "codicon codicon-sync",
  blocked: "codicon codicon-lock",
  failed: "codicon codicon-error",
  succeeded: "codicon codicon-check",
  canceled: "codicon codicon-circle-slash"
};

// Human-readable labels for each status
const LABEL: Record<Status, string> = {
  queued: "Queued",
  running: "Running",
  blocked: "Blocked",
  failed: "Failed",
  succeeded: "Succeeded",
  canceled: "Canceled"
};

// ── Variants ─────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  // Base: inline-flex, centred content, no text wrap
  "inline-flex items-center gap-1 font-medium whitespace-nowrap select-none",
  {
    variants: {
      variant: {
        dot: "rounded-full",
        text: "rounded px-1.5 py-0.5 text-[length:var(--text-xs)]",
        count: "rounded px-1.5 py-0.5 text-[length:var(--text-xs)]"
      },
      status: {
        queued: "",
        running: "",
        blocked: "",
        failed: "",
        succeeded: "",
        canceled: ""
      }
    },
    compoundVariants: [
      // dot variant — just a coloured circle, no bg
      {
        variant: "dot",
        status: "queued",
        class: "text-[color:var(--color-status-queued)]"
      },
      {
        variant: "dot",
        status: "running",
        class: "text-[color:var(--color-status-running)]"
      },
      {
        variant: "dot",
        status: "blocked",
        class: "text-[color:var(--color-status-blocked)]"
      },
      {
        variant: "dot",
        status: "failed",
        class: "text-[color:var(--color-status-failed)]"
      },
      {
        variant: "dot",
        status: "succeeded",
        class: "text-[color:var(--color-status-succeeded)]"
      },
      {
        variant: "dot",
        status: "canceled",
        class: "text-[color:var(--color-status-canceled)]"
      },
      // text + count variants — icon + label/number with tinted background
      {
        variant: "text",
        status: "queued",
        class:
          "text-[color:var(--color-status-queued)]    bg-[color:var(--color-status-queued-bg)]"
      },
      {
        variant: "text",
        status: "running",
        class:
          "text-[color:var(--color-status-running)]   bg-[color:var(--color-status-running-bg)]"
      },
      {
        variant: "text",
        status: "blocked",
        class:
          "text-[color:var(--color-status-blocked)]   bg-[color:var(--color-status-blocked-bg)]"
      },
      {
        variant: "text",
        status: "failed",
        class:
          "text-[color:var(--color-status-failed)]    bg-[color:var(--color-status-failed-bg)]"
      },
      {
        variant: "text",
        status: "succeeded",
        class:
          "text-[color:var(--color-status-succeeded)] bg-[color:var(--color-status-succeeded-bg)]"
      },
      {
        variant: "text",
        status: "canceled",
        class:
          "text-[color:var(--color-status-canceled)]  bg-[color:var(--color-status-canceled-bg)]"
      },
      {
        variant: "count",
        status: "queued",
        class:
          "text-[color:var(--color-status-queued)]    bg-[color:var(--color-status-queued-bg)]"
      },
      {
        variant: "count",
        status: "running",
        class:
          "text-[color:var(--color-status-running)]   bg-[color:var(--color-status-running-bg)]"
      },
      {
        variant: "count",
        status: "blocked",
        class:
          "text-[color:var(--color-status-blocked)]   bg-[color:var(--color-status-blocked-bg)]"
      },
      {
        variant: "count",
        status: "failed",
        class:
          "text-[color:var(--color-status-failed)]    bg-[color:var(--color-status-failed-bg)]"
      },
      {
        variant: "count",
        status: "succeeded",
        class:
          "text-[color:var(--color-status-succeeded)] bg-[color:var(--color-status-succeeded-bg)]"
      },
      {
        variant: "count",
        status: "canceled",
        class:
          "text-[color:var(--color-status-canceled)]  bg-[color:var(--color-status-canceled-bg)]"
      }
    ],
    defaultVariants: {
      variant: "text",
      status: "queued"
    }
  }
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status: Status;
  /** For `count` variant: the numeric value to display after the icon. */
  count?: number | undefined;
  /** Additional class names to merge. */
  class?: string | undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatusBadge({
  status,
  variant = "text",
  count,
  class: className
}: StatusBadgeProps) {
  const label = LABEL[status];
  const iconClass = CODICON[status];
  const isRunning = status === "running";

  if (variant === "dot") {
    return (
      <span
        class={cn(badgeVariants({ variant, status }), className)}
        role="status"
        aria-label={label}
        title={label}
      >
        {/* dot — 8px filled circle */}
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          aria-hidden="true"
          class={cn(isRunning && "animate-[var(--animate-pulse)]")}
        >
          <circle cx="4" cy="4" r="4" fill="currentColor" />
        </svg>
      </span>
    );
  }

  if (variant === "count") {
    return (
      <span
        class={cn(badgeVariants({ variant, status }), className)}
        role="status"
        aria-label={`${label}: ${count ?? 0}`}
      >
        <i
          class={cn(iconClass, isRunning && "animate-[var(--animate-spin)]")}
          aria-hidden="true"
        />
        <span>{count ?? 0}</span>
      </span>
    );
  }

  // text (default)
  return (
    <span
      class={cn(badgeVariants({ variant, status }), className)}
      role="status"
      aria-label={label}
    >
      <i
        class={cn(iconClass, isRunning && "animate-[var(--animate-spin)]")}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
