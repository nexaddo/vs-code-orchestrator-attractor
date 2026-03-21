/**
 * Design system component exports.
 *
 * Import primitives from this barrel:
 *   import { Button, StatusBadge, Card, ... } from '../components';
 */

export { StatusBadge } from "./StatusBadge";
export type { StatusBadgeProps, Status } from "./StatusBadge";

export { Button } from "./Button";
export type { ButtonProps } from "./Button";

export { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./Card";
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardContentProps,
  CardFooterProps
} from "./Card";

export { ProgressBar } from "./ProgressBar";
export type { ProgressBarProps } from "./ProgressBar";

export { SkeletonRow, SkeletonBlock } from "./SkeletonRow";
export type { SkeletonRowProps, SkeletonBlockProps } from "./SkeletonRow";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps, EmptyStateCTA } from "./EmptyState";

export { LogLine } from "./LogLine";
export type { LogLineProps } from "./LogLine";

export { Badge, ProgressBadge } from "./Badge";
export type { BadgeProps, ProgressBadgeProps } from "./Badge";
