/**
 * Shared UI Components
 *
 * Centralized, reusable UI components for consistent design across the application.
 * All components follow accessibility best practices (WCAG 2.1 AA).
 */

// Card component
export { Card, type CardProps } from './Card';

// Badge components
export {
  Badge,
  PriorityBadge,
  type BadgeProps,
  type BadgeVariant,
  type BadgeSize,
  type PriorityBadgeProps,
} from './Badge';

// Progress bar components
export {
  ProgressBar,
  ScoreBar,
  type ProgressBarProps,
  type ProgressBarVariant,
  type ScoreBarProps,
} from './ProgressBar';

// Section title component
export { SectionTitle, type SectionTitleProps } from './SectionTitle';

// Collapsible component
export { Collapsible, type CollapsibleProps } from './Collapsible';

// Skeleton loading components
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  type SkeletonProps,
  type SkeletonTextProps,
  type SkeletonCardProps,
} from './Skeleton';
