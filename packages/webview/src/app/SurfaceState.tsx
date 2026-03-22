/**
 * SurfaceState — renders loading, error, or empty placeholders using
 * the design system primitives (EmptyState, SkeletonRow).
 *
 * Use inside a SurfaceFrame to show the appropriate state before surface
 * content is available.  Once the payload arrives, the caller renders
 * the real content instead.
 */

import { type JSX } from "preact";
import { EmptyState, type EmptyStateCTA } from "../components/EmptyState";
import { SkeletonRow } from "../components/SkeletonRow";

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

export interface SurfaceLoadingProps {
  /** Number of skeleton rows to display. Defaults to 5. */
  rows?: number | undefined;
  class?: string | undefined;
}

export function SurfaceLoading({
  rows = 5,
  class: className
}: SurfaceLoadingProps = {}): JSX.Element {
  return (
    <div class={className} data-testid="surface-loading">
      <SkeletonRow variant="row" count={rows} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

export interface SurfaceErrorProps {
  message: string;
  onRetry?: (() => void) | undefined;
  class?: string | undefined;
}

export function SurfaceError({
  message,
  onRetry,
  class: className
}: SurfaceErrorProps): JSX.Element {
  const cta: EmptyStateCTA | undefined = onRetry
    ? { label: "Retry", onClick: onRetry }
    : undefined;

  return (
    <div class={className} data-testid="surface-error">
      <EmptyState
        icon="codicon codicon-error"
        heading="Something went wrong"
        subtext={message}
        cta={cta}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export interface SurfaceEmptyProps {
  icon?: string | undefined;
  heading: string;
  subtext?: string | undefined;
  cta?: EmptyStateCTA | undefined;
  class?: string | undefined;
}

export function SurfaceEmpty({
  icon = "codicon codicon-inbox",
  heading,
  subtext,
  cta,
  class: className
}: SurfaceEmptyProps): JSX.Element {
  return (
    <div class={className} data-testid="surface-empty">
      <EmptyState icon={icon} heading={heading} subtext={subtext} cta={cta} />
    </div>
  );
}
