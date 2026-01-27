'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge content */
  children: ReactNode;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Optional icon before text */
  icon?: ReactNode;
  /** Whether to show a dot indicator */
  dot?: boolean;
  /** Dot color (uses variant color by default) */
  dotColor?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon,
      dot = false,
      dotColor,
      className = '',
      ...props
    },
    ref
  ) => {
    const badgeClasses = [
      styles.badge,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={badgeClasses} {...props}>
        {dot && (
          <span
            className={styles.dot}
            style={dotColor ? { backgroundColor: dotColor } : undefined}
          />
        )}
        {icon && <span className={styles.icon}>{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Priority badge preset
export interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'high' | 'medium' | 'low';
}

export const PriorityBadge = forwardRef<HTMLSpanElement, PriorityBadgeProps>(
  ({ priority, ...props }, ref) => {
    const variantMap: Record<string, BadgeVariant> = {
      high: 'error',
      medium: 'warning',
      low: 'info',
    };

    return <Badge ref={ref} variant={variantMap[priority]} {...props} />;
  }
);

PriorityBadge.displayName = 'PriorityBadge';

export default Badge;
